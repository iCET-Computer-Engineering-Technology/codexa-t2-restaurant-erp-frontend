import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError, concatMap, delay } from 'rxjs/operators';
import { OrderService } from '../../services/order.service';
import { PaymentService } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';
import { OrderWithItemNameResponse } from '../../models/order.model';
import { PaymentDto, PaymentMethod, PaymentRow } from '../../models/payment.model';

type ViewState = 'summary' | 'form';
type OrderListFilter = 'unpaid' | 'paid' | 'all';

@Component({
  selector: 'app-payments',
  imports: [CommonModule, FormsModule],
  templateUrl: './payments.component.html',
  styleUrls: ['./payments.component.css']
})
export class PaymentsComponent implements OnInit {
  // State
  readonly allOrders = signal<OrderWithItemNameResponse[]>([]);
  readonly unpaidOrders = signal<OrderWithItemNameResponse[]>([]);
  readonly paidOrders = signal<OrderWithItemNameResponse[]>([]);
  readonly orderListFilter = signal<OrderListFilter>('unpaid');
  readonly paymentExistsByOrderId = signal<Map<number, boolean>>(new Map());

  readonly selectedOrder = signal<OrderWithItemNameResponse | null>(null);
  readonly viewState = signal<ViewState>('summary');
  readonly isLoading = signal<boolean>(false);
  readonly isCheckingPayments = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly isProcessing = signal<boolean>(false);

  // Payment form state
  readonly paymentMethod = signal<PaymentMethod>('cash');
  // For card/mixed the paid amount is typically the order total.
  readonly amount = signal<number>(0);
  // Cash UX: cashier enters cash received; change is computed locally.
  readonly cashReceived = signal<number>(0);
  readonly tipAmount = signal<number>(0);
  readonly referenceNumber = signal<string>('');
  readonly mixedPayments = signal<PaymentRow[]>([]);

  // Computed
  readonly filteredOrders = computed(() => {
    const filter = this.orderListFilter();
    if (filter === 'paid') return this.paidOrders();
    if (filter === 'all') return this.allOrders();
    return this.unpaidOrders();
  });

  readonly hasOrders = computed(() => this.filteredOrders().length > 0);
  readonly hasError = computed(() => !!this.error());

  readonly totalDue = computed(() => this.selectedOrder()?.totalAmount ?? 0);
  readonly changeAmount = computed(() => {
    const received = this.cashReceived();
    const due = this.totalDue();
    if (!Number.isFinite(received) || !Number.isFinite(due)) return 0;
    return Math.max(0, received - due);
  });

  readonly selectedOrderIsPaid = computed(() => {
    const id = this.selectedOrder()?.id;
    if (!id) return false;
    return this.paymentExistsByOrderId().get(id) === true;
  });

  readonly totalMixed = computed(() => {
    return this.mixedPayments().reduce((sum, p) => sum + (p.amount || 0), 0);
  });

  readonly remainingAmount = computed(() => {
    const total = this.totalDue();
    return total - this.totalMixed();
  });

  readonly isValidPayment = computed(() => {
    const order = this.selectedOrder();
    if (!order) return false;
    if (this.selectedOrderIsPaid()) return false;

    const method = this.paymentMethod();
    const due = order.totalAmount;

    if (method === 'cash') {
      return this.cashReceived() >= due;
    }

    if (method === 'card') {
      return this.amount() >= due && this.referenceNumber().trim().length > 0;
    }

    if (method === 'mixed') {
      const remaining = this.remainingAmount();
      const allHaveRef = this.mixedPayments().every(p => 
        p.method === 'cash' || (p.method === 'card' && p.referenceNumber && p.referenceNumber.trim().length > 0)
      );
      return remaining === 0 && allHaveRef;
    }

    return false;
  });

  constructor(
    private orderService: OrderService,
    private paymentService: PaymentService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadUnpaidOrders();
  }

  setOrderListFilter(filter: OrderListFilter): void {
    this.orderListFilter.set(filter);
  }

  loadUnpaidOrders(): void {
    this.isLoading.set(true);
    this.isCheckingPayments.set(true);
    this.error.set(null);
    this.selectedOrder.set(null);
    this.viewState.set('summary');

    // Step 1: Get all orders
    this.orderService.getAllOrdersWithItemNames().subscribe({
      next: (orders) => {
        // Filter to potentially unpaid orders (not voided, has total > 0)
        const potentiallyUnpaid = orders.filter(
          o => o.status !== 'voided' && o.totalAmount > 0
        );

        this.allOrders.set(potentiallyUnpaid);

        if (potentiallyUnpaid.length === 0) {
          this.unpaidOrders.set([]);
          this.paidOrders.set([]);
          this.paymentExistsByOrderId.set(new Map());
          this.isLoading.set(false);
          this.isCheckingPayments.set(false);
          return;
        }

        // Step 2: Check payment status for each order (batch in groups of 5)
        this.checkPaymentStatus(potentiallyUnpaid);
      },
      error: (err) => {
        this.error.set('Failed to load orders. Please try again.');
        this.isLoading.set(false);
        this.isCheckingPayments.set(false);
        console.error('Error loading orders:', err);
      }
    });
  }

  private checkPaymentStatus(orders: OrderWithItemNameResponse[]): void {
    const batchSize = 5;
    const batches: OrderWithItemNameResponse[][] = [];
    
    // Split orders into batches
    for (let i = 0; i < orders.length; i += batchSize) {
      batches.push(orders.slice(i, i + batchSize));
    }

    // Process batches sequentially with delay
    const unpaidList: OrderWithItemNameResponse[] = [];
    const paidList: OrderWithItemNameResponse[] = [];
    const paymentMap = new Map<number, boolean>();
    
    const processBatch = (batchIndex: number) => {
      if (batchIndex >= batches.length) {
        const sortByCreatedAtAsc = (a: OrderWithItemNameResponse, b: OrderWithItemNameResponse) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
        
        const sortByCreatedAtDesc = (a: OrderWithItemNameResponse, b: OrderWithItemNameResponse) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();

        // All batches processed - unpaid oldest first, paid newest first
        this.unpaidOrders.set([...unpaidList].sort(sortByCreatedAtAsc));
        this.paidOrders.set([...paidList].sort(sortByCreatedAtDesc));
        this.paymentExistsByOrderId.set(paymentMap);
        this.isLoading.set(false);
        this.isCheckingPayments.set(false);
        return;
      }

      const batch = batches[batchIndex];
      const checks = batch.map(order => 
        this.paymentService.getPaymentByOrderId(order.id).pipe(
          catchError(() => of(null))
        )
      );

      forkJoin(checks).subscribe({
        next: (payments) => {
          // Add orders with no payment to unpaid list
          batch.forEach((order, idx) => {
            const isPaid = payments[idx] !== null;
            paymentMap.set(order.id, isPaid);
            if (!isPaid) {
              unpaidList.push(order);
            } else {
              paidList.push(order);
            }
          });

          // Process next batch after small delay
          setTimeout(() => processBatch(batchIndex + 1), 100);
        },
        error: () => {
          // On error, assume all in batch are unpaid and continue
          unpaidList.push(...batch);
          for (const order of batch) {
            paymentMap.set(order.id, false);
          }
          setTimeout(() => processBatch(batchIndex + 1), 100);
        }
      });
    };

    processBatch(0);
  }

  selectOrder(order: OrderWithItemNameResponse): void {
    this.selectedOrder.set(order);
    this.viewState.set('summary');
    this.resetPaymentForm();
  }

  showPaymentForm(): void {
    this.viewState.set('form');
    const order = this.selectedOrder();
    if (order) {
      this.amount.set(order.totalAmount);
      this.cashReceived.set(order.totalAmount);
    }
  }

  backToSummary(): void {
    this.viewState.set('summary');
    this.resetPaymentForm();
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.paymentMethod.set(method);
    const order = this.selectedOrder();
    if (order) {
      this.amount.set(order.totalAmount);
      this.cashReceived.set(order.totalAmount);
    }
    
    if (method === 'mixed') {
      // Initialize with one cash row
      this.mixedPayments.set([{ method: 'cash', amount: 0 }]);
    } else {
      this.mixedPayments.set([]);
    }
  }

  addPaymentRow(): void {
    this.mixedPayments.update(rows => [...rows, { method: 'cash', amount: 0 }]);
  }

  removePaymentRow(index: number): void {
    this.mixedPayments.update(rows => rows.filter((_, i) => i !== index));
  }

  updatePaymentRow(index: number, field: keyof PaymentRow, value: any): void {
    this.mixedPayments.update(rows => {
      const updated = [...rows];
      updated[index] = { ...updated[index], [field]: value };
      return updated;
    });
  }

  confirmPayment(): void {
    const order = this.selectedOrder();
    const isValid = this.isValidPayment();
    const userId = this.authService.getUserId() || undefined; // Use undefined if no user ID

    console.log('🔍 Payment Debug:', {
      hasOrder: !!order,
      userId: userId,
      isValid,
      method: this.paymentMethod(),
      cashReceived: this.cashReceived(),
      totalDue: this.totalDue(),
      validation: {
        cashCheck: this.cashReceived() >= (order?.totalAmount ?? 0),
        orderCheck: !!order
      }
    });

    if (!order) {
      console.error('❌ No order selected');
      this.error.set('No order selected');
      return;
    }
    
    if (!isValid) {
      console.error('❌ Payment validation failed');
      return;
    }

    this.isProcessing.set(true);
    this.error.set(null);

    const method = this.paymentMethod();
    console.log('✅ Validation passed, creating payment:', method);

    if (method === 'cash' || method === 'card') {
      // Single payment
      // Try uppercase payment method in case backend expects it
      const paymentMethodForBackend = method.toUpperCase();
      
      const payment: PaymentDto = {
        orderId: order.id,
        paymentMethod: paymentMethodForBackend, // 👈 Convert to uppercase
        amount: order.totalAmount,
        tipAmount: this.tipAmount() || 0,
        referenceNumber: method === 'card' ? this.referenceNumber() : undefined,
        processedBy: userId
      };

      console.log('💳 Payment Payload:', {
        orderId: order.id,
        orderTotalAmount: order.totalAmount,
        method,
        paymentMethodForBackend,
        amount: order.totalAmount,
        tipAmount: this.tipAmount(),
        referenceNumber: method === 'card' ? this.referenceNumber() : 'N/A',
        userId,
        fullPayload: payment,
        types: {
          orderId: typeof order.id,
          amount: typeof order.totalAmount,
          paymentMethod: typeof paymentMethodForBackend,
          tipAmount: typeof (this.tipAmount() || 0),
          processedBy: typeof userId
        }
      });

      this.paymentService.createPayment(payment).subscribe({
        next: (response) => {
          console.log('✅ Payment created successfully:', response);
          this.onPaymentSuccess();
        },
        error: (err) => {
          console.error('❌ Payment API error (Full):', {
            status: err.status,
            statusText: err.statusText,
            message: err.message,
            error: err.error,
            errorMessage: err.error?.message,
            errorDetails: err.error?.details,
            payload: payment
          });
          
          const errorMsg = err.error?.message 
            || err.error?.error 
            || err.message 
            || 'Payment failed. Please try again.';
          
          this.error.set(`API Error: ${errorMsg}`);
          this.isProcessing.set(false);
        }
      });
    } else if (method === 'mixed') {
      // Multiple payments - process sequentially
      const payments = this.mixedPayments().map((row, idx) => ({
        orderId: order.id,
        paymentMethod: row.method,
        amount: row.amount,
        tipAmount: idx === this.mixedPayments().length - 1 ? (this.tipAmount() || 0) : 0,
        referenceNumber: row.referenceNumber,
        processedBy: userId
      }));

      console.log('💳 Sending mixed payments:', payments);
      this.processMixedPayments(payments, 0);
    }
  }

  private processMixedPayments(payments: PaymentDto[], index: number): void {
    if (index >= payments.length) {
      this.onPaymentSuccess();
      return;
    }

    this.paymentService.createPayment(payments[index]).subscribe({
      next: () => {
        this.processMixedPayments(payments, index + 1);
      },
      error: (err) => {
        this.error.set(`Payment ${index + 1} of ${payments.length} failed. Please contact support.`);
        this.isProcessing.set(false);
        console.error('Mixed payment error:', err);
      }
    });
  }

  private onPaymentSuccess(): void {
    const order = this.selectedOrder();
    if (!order) return;

    console.log('🎉 Payment success! Order:', order.id);
    // Show success message (you can add a toast service here)
    alert('Payment recorded successfully');

    // Remove order from unpaid list
    this.unpaidOrders.update(orders => orders.filter(o => o.id !== order.id));

    // Mark as paid in-memory
    this.paidOrders.update((orders) => {
      if (orders.some((o) => o.id === order.id)) return orders;
      return [...orders, order].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    });
    this.paymentExistsByOrderId.update((map) => {
      const next = new Map(map);
      next.set(order.id, true);
      return next;
    });

    // Reset selection
    this.selectedOrder.set(null);
    this.viewState.set('summary');
    this.isProcessing.set(false);
    this.resetPaymentForm();
  }

  private resetPaymentForm(): void {
    this.paymentMethod.set('cash');
    this.amount.set(0);
    this.cashReceived.set(0);
    this.tipAmount.set(0);
    this.referenceNumber.set('');
    this.mixedPayments.set([]);
    this.error.set(null);
  }

  private parseMoneyInput(value: unknown): number {
    // Accept number or string; strip commas/spaces.
    const raw = typeof value === 'number' ? String(value) : String(value ?? '');
    const normalized = raw.replace(/,/g, '').trim();

    if (normalized.length === 0) {
      return 0;
    }

    const parsed = Number.parseFloat(normalized);
    if (!Number.isFinite(parsed)) {
      return 0;
    }

    // Clamp to prevent runaway/invalid values showing as scientific notation.
    const clamped = Math.min(Math.max(parsed, 0), 1_000_000_000);

    // Round to 2 decimals.
    return Math.round(clamped * 100) / 100;
  }

  setCashReceivedFromInput(value: unknown): void {
    this.cashReceived.set(this.parseMoneyInput(value));
  }

  setTipFromInput(value: unknown): void {
    this.tipAmount.set(this.parseMoneyInput(value));
  }

  setAmountFromInput(value: unknown): void {
    this.amount.set(this.parseMoneyInput(value));
  }

  setReferenceFromInput(value: string): void {
    this.referenceNumber.set(String(value ?? ''));
  }

  retry(): void {
    this.loadUnpaidOrders();
  }

  testPaymentAPI(): void {
    console.log('🧪 Testing Payment API...');
    this.paymentService.getAllPayments().subscribe({
      next: (payments) => {
        console.log('✅ API is reachable! Payments:', payments);
        alert('✅ Payment API is working');
      },
      error: (err) => {
        console.error('❌ API Error:', err);
        alert(`❌ Payment API Error: ${err.status} - ${err.message}`);
      }
    });
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;
  }
}
