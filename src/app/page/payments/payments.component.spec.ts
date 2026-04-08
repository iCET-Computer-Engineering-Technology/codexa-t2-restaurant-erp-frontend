import { TestBed, ComponentFixture } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';
import { PaymentsComponent } from './payments.component';
import { OrderService } from '../../services/order.service';
import { PaymentService } from '../../services/payment.service';
import { AuthService } from '../../services/auth.service';
import { of, throwError } from 'rxjs';
import { OrderWithItemNameResponse } from '../../models/order.model';
import { PaymentDto } from '../../models/payment.model';

describe('PaymentsComponent', () => {
    let component: PaymentsComponent;
    let fixture: ComponentFixture<PaymentsComponent>;
    let orderService: any;
    let paymentService: any;
    let authService: any;

    const mockOrders: OrderWithItemNameResponse[] = [
        {
            id: 1,
            orderNumber: 'ORD-001',
            tableId: 1,
            orderType: 'Dine In',
            status: 'completed',
            totalAmount: 5000,
            subTotal: 4000,
            taxAmount: 500,
            discountAmount: 0,
            serviceCharge: 500,
            createdAt: new Date().toISOString(),
            items: [
                {
                    id: 1,
                    menuItemName: 'Biryani',
                    portionName: 'Large',
                    quantity: 1,
                    price: 500,
                    lineTotal: 500
                }
            ]
        },
        {
            id: 2,
            orderNumber: 'ORD-002',
            tableId: 2,
            orderType: 'Takeaway',
            status: 'completed',
            totalAmount: 3000,
            subTotal: 2500,
            taxAmount: 250,
            discountAmount: 0,
            serviceCharge: 250,
            createdAt: new Date().toISOString(),
            items: []
        }
    ];

    beforeEach(async () => {
        const orderServiceSpy = jasmine.createSpyObj('OrderService', ['getAllOrdersWithItemNames']);
        const paymentServiceSpy = jasmine.createSpyObj('PaymentService', [
            'getPaymentByOrderId',
            'createPayment',
            'getAllPayments'
        ]);
        const authServiceSpy = jasmine.createSpyObj('AuthService', ['getUserId']);

        await TestBed.configureTestingModule({
            imports: [PaymentsComponent, HttpClientTestingModule],
            providers: [
                { provide: OrderService, useValue: orderServiceSpy },
                { provide: PaymentService, useValue: paymentServiceSpy },
                { provide: AuthService, useValue: authServiceSpy }
            ]
        }).compileComponents();

        orderService = TestBed.inject(OrderService) as any;
        paymentService = TestBed.inject(PaymentService) as any;
        authService = TestBed.inject(AuthService) as any;

        fixture = TestBed.createComponent(PaymentsComponent);
        component = fixture.componentInstance;
    });

    describe('Component Initialization', () => {
        it('should create the component', () => {
            expect(component).toBeTruthy();
        });

        it('should load unpaid orders on init', () => {
            orderService.getAllOrdersWithItemNames.and.returnValue(of(mockOrders));
            paymentService.getPaymentByOrderId.and.returnValue(of(null));

            component.ngOnInit();
            fixture.detectChanges();

            expect(orderService.getAllOrdersWithItemNames).toHaveBeenCalled();
        });

        it('should initialize signals with default values', () => {
            expect(component.orderListFilter()).toBe('unpaid');
            expect(component.viewState()).toBe('summary');
            expect(component.paymentMethod()).toBe('cash');
            expect(component.cartItems.length).toBe(0);
            expect(component.isLoading()).toBe(false);
        });
    });

    describe('Order Loading and Filtering', () => {
        it('should load and separate unpaid and paid orders', (done) => {
            orderService.getAllOrdersWithItemNames.and.returnValue(of(mockOrders));
            paymentService.getPaymentByOrderId.and.callFake((orderId) => {
                return orderId === 1 ? of(null) : of({ id: 1, orderId, paymentMethod: 'CASH', amount: 3000 });
            });

            component.loadUnpaidOrders();

            setTimeout(() => {
                fixture.detectChanges();
                expect(component.unpaidOrders().length).toBeGreaterThan(0);
                done();
            }, 200);
        });

        it('should filter orders by unpaid status', () => {
            component.allOrders.set(mockOrders);
            component.unpaidOrders.set([mockOrders[0]]);
            component.paidOrders.set([mockOrders[1]]);
            component.orderListFilter.set('unpaid');

            expect(component.filteredOrders()).toEqual([mockOrders[0]]);
        });

        it('should filter orders by paid status', () => {
            component.allOrders.set(mockOrders);
            component.unpaidOrders.set([mockOrders[0]]);
            component.paidOrders.set([mockOrders[1]]);
            component.orderListFilter.set('paid');

            expect(component.filteredOrders()).toEqual([mockOrders[1]]);
        });

        it('should show all orders when filter is all', () => {
            component.allOrders.set(mockOrders);
            component.unpaidOrders.set([mockOrders[0]]);
            component.paidOrders.set([mockOrders[1]]);
            component.orderListFilter.set('all');

            expect(component.filteredOrders()).toEqual(mockOrders);
        });

        it('should handle empty orders gracefully', () => {
            orderService.getAllOrdersWithItemNames.and.returnValue(of([]));

            component.loadUnpaidOrders();
            fixture.detectChanges();

            expect(component.hasOrders()).toBe(false);
        });

        it('should filter out voided orders', () => {
            const voidedOrder = { ...mockOrders[0], status: 'voided' };
            orderService.getAllOrdersWithItemNames.and.returnValue(of([voidedOrder, mockOrders[1]]));
            paymentService.getPaymentByOrderId.and.returnValue(of(null));

            component.loadUnpaidOrders();
            fixture.detectChanges();

            expect(component.allOrders()[0].status).not.toBe('voided');
        });
    });

    describe('Order Selection', () => {
        it('should select an order', () => {
            component.selectOrder(mockOrders[0]);

            expect(component.selectedOrder()).toEqual(mockOrders[0]);
            expect(component.viewState()).toBe('summary');
        });

        it('should reset payment form when selecting order', () => {
            component.paymentMethod.set('card');
            component.tipAmount.set(500);
            component.referenceNumber.set('REF-123');

            component.selectOrder(mockOrders[0]);

            expect(component.paymentMethod()).toBe('cash');
            expect(component.tipAmount()).toBe(0);
            expect(component.referenceNumber()).toBe('');
        });

        it('should deselect order when selecting null', () => {
            component.selectedOrder.set(mockOrders[0]);
            component.selectOrder(null as any);

            expect(component.selectedOrder()).toBeNull();
        });
    });

    describe('Payment Method Selection', () => {
        beforeEach(() => {
            component.selectedOrder.set(mockOrders[0]);
        });

        it('should select cash payment method', () => {
            component.selectPaymentMethod('cash');

            expect(component.paymentMethod()).toBe('cash');
            expect(component.cashReceived()).toBe(mockOrders[0].totalAmount);
        });

        it('should select card payment method', () => {
            component.selectPaymentMethod('card');

            expect(component.paymentMethod()).toBe('card');
            expect(component.amount()).toBe(mockOrders[0].totalAmount);
        });

        it('should select mixed payment method and initialize with one cash row', () => {
            component.selectPaymentMethod('mixed');

            expect(component.paymentMethod()).toBe('mixed');
            expect(component.mixedPayments().length).toBe(1);
            expect(component.mixedPayments()[0].method).toBe('cash');
        });

        it('should clear mixed payments when switching to cash', () => {
            component.selectPaymentMethod('mixed');
            component.selectPaymentMethod('cash');

            expect(component.mixedPayments().length).toBe(0);
        });
    });

    describe('Cash Payment Validation', () => {
        beforeEach(() => {
            component.selectedOrder.set(mockOrders[0]);
            component.paymentMethod.set('cash');
        });

        it('should validate cash payment when exact amount is paid', () => {
            component.cashReceived.set(mockOrders[0].totalAmount);

            expect(component.isValidPayment()).toBe(true);
        });

        it('should validate cash payment when more than amount is paid', () => {
            component.cashReceived.set(mockOrders[0].totalAmount + 1000);

            expect(component.isValidPayment()).toBe(true);
        });

        it('should reject cash payment when insufficient amount is paid', () => {
            component.cashReceived.set(mockOrders[0].totalAmount - 1000);

            expect(component.isValidPayment()).toBe(false);
        });

        it('should calculate change for cash payment', () => {
            const received = mockOrders[0].totalAmount + 1000;
            component.cashReceived.set(received);

            const expectedChange = received - mockOrders[0].totalAmount;
            expect(component.changeAmount()).toBe(expectedChange);
        });

        it('should return zero change when exact amount is paid', () => {
            component.cashReceived.set(mockOrders[0].totalAmount);

            expect(component.changeAmount()).toBe(0);
        });
    });

    describe('Card Payment Validation', () => {
        beforeEach(() => {
            component.selectedOrder.set(mockOrders[0]);
            component.paymentMethod.set('card');
        });

        it('should validate card payment with reference number', () => {
            component.amount.set(mockOrders[0].totalAmount);
            component.referenceNumber.set('CARD-REF-12345');

            expect(component.isValidPayment()).toBe(true);
        });

        it('should reject card payment without reference number', () => {
            component.amount.set(mockOrders[0].totalAmount);
            component.referenceNumber.set('');

            expect(component.isValidPayment()).toBe(false);
        });

        it('should reject card payment with insufficient amount', () => {
            component.amount.set(mockOrders[0].totalAmount - 1000);
            component.referenceNumber.set('CARD-REF-12345');

            expect(component.isValidPayment()).toBe(false);
        });

        it('should reject card payment when only whitespace in reference', () => {
            component.amount.set(mockOrders[0].totalAmount);
            component.referenceNumber.set('   ');

            expect(component.isValidPayment()).toBe(false);
        });
    });

    describe('Mixed Payment Validation', () => {
        beforeEach(() => {
            component.selectedOrder.set(mockOrders[0]);
            component.paymentMethod.set('mixed');
        });

        it('should validate mixed payment with cash and card', () => {
            component.mixedPayments.set([
                { method: 'cash', amount: 2000 },
                { method: 'card', amount: 3000, referenceNumber: 'REF-123' }
            ]);

            expect(component.isValidPayment()).toBe(true);
        });

        it('should reject mixed payment without full amount coverage', () => {
            component.mixedPayments.set([
                { method: 'cash', amount: 2000 },
                { method: 'card', amount: 2000, referenceNumber: 'REF-123' }
            ]);

            expect(component.isValidPayment()).toBe(false);
        });

        it('should reject mixed payment without card reference', () => {
            component.mixedPayments.set([
                { method: 'cash', amount: 2000 },
                { method: 'card', amount: 3000 }
            ]);

            expect(component.isValidPayment()).toBe(false);
        });

        it('should calculate remaining amount for mixed payment', () => {
            component.mixedPayments.set([
                { method: 'cash', amount: 2000 },
                { method: 'card', amount: 2000, referenceNumber: 'REF-123' }
            ]);

            const remaining = mockOrders[0].totalAmount - 4000;
            expect(component.remainingAmount()).toBe(remaining);
        });

        it('should add payment row to mixed payments', () => {
            component.mixedPayments.set([{ method: 'cash', amount: 0 }]);
            component.addPaymentRow();

            expect(component.mixedPayments().length).toBe(2);
        });

        it('should remove payment row from mixed payments', () => {
            component.mixedPayments.set([
                { method: 'cash', amount: 1000 },
                { method: 'card', amount: 2000, referenceNumber: 'REF-123' }
            ]);
            component.removePaymentRow(0);

            expect(component.mixedPayments().length).toBe(1);
            expect(component.mixedPayments()[0].method).toBe('card');
        });

        it('should update payment row field', () => {
            component.mixedPayments.set([{ method: 'cash', amount: 0 }]);
            component.updatePaymentRow(0, 'amount', 2000);

            expect(component.mixedPayments()[0].amount).toBe(2000);
        });

        it('should change payment row method', () => {
            component.mixedPayments.set([{ method: 'cash', amount: 0 }]);
            component.updatePaymentRow(0, 'method', 'card');

            expect(component.mixedPayments()[0].method).toBe('card');
        });
    });

    describe('Payment Confirmation', () => {
        beforeEach(() => {
            authService.getUserId.and.returnValue(1);
            component.selectedOrder.set(mockOrders[0]);
        });

        it('should confirm cash payment successfully', (done) => {
            component.paymentMethod.set('cash');
            component.cashReceived.set(mockOrders[0].totalAmount);
            paymentService.createPayment.and.returnValue(of({ id: 1 }));

            component.confirmPayment();

            setTimeout(() => {
                expect(paymentService.createPayment).toHaveBeenCalled();
                const callArgs = paymentService.createPayment.calls.mostRecent().args[0];
                expect(callArgs.paymentMethod).toBe('CASH');
                expect(callArgs.amount).toBe(mockOrders[0].totalAmount);
                done();
            }, 100);
        });

        it('should confirm card payment with reference number', (done) => {
            component.paymentMethod.set('card');
            component.amount.set(mockOrders[0].totalAmount);
            component.referenceNumber.set('CARD-REF-123');
            paymentService.createPayment.and.returnValue(of({ id: 1 }));

            component.confirmPayment();

            setTimeout(() => {
                const callArgs = paymentService.createPayment.calls.mostRecent().args[0];
                expect(callArgs.paymentMethod).toBe('CARD');
                expect(callArgs.referenceNumber).toBe('CARD-REF-123');
                done();
            }, 100);
        });

        it('should not confirm payment with invalid data', () => {
            component.paymentMethod.set('cash');
            component.cashReceived.set(0);

            component.confirmPayment();

            expect(paymentService.createPayment).not.toHaveBeenCalled();
        });

        it('should not confirm payment when no order is selected', () => {
            component.selectedOrder.set(null);
            paymentService.createPayment.and.returnValue(of({ id: 1 }));

            component.confirmPayment();

            expect(paymentService.createPayment).not.toHaveBeenCalled();
            expect(component.error()).toContain('No order selected');
        });

        it('should include tip amount in payment', (done) => {
            component.paymentMethod.set('cash');
            component.cashReceived.set(mockOrders[0].totalAmount + 500);
            component.tipAmount.set(500);
            paymentService.createPayment.and.returnValue(of({ id: 1 }));

            component.confirmPayment();

            setTimeout(() => {
                const callArgs = paymentService.createPayment.calls.mostRecent().args[0];
                expect(callArgs.tipAmount).toBe(500);
                done();
            }, 100);
        });

        it('should handle payment creation error', (done) => {
            component.paymentMethod.set('cash');
            component.cashReceived.set(mockOrders[0].totalAmount);
            paymentService.createPayment.and.returnValue(
                throwError(() => ({ error: { message: 'Payment processing failed' }, status: 400 }))
            );

            component.confirmPayment();

            setTimeout(() => {
                expect(component.error()).toBeTruthy();
                expect(component.isProcessing()).toBe(false);
                done();
            }, 100);
        });

        it('should move order to paid list after successful payment', (done) => {
            component.unpaidOrders.set([mockOrders[0]]);
            component.paidOrders.set([]);
            component.paymentMethod.set('cash');
            component.cashReceived.set(mockOrders[0].totalAmount);
            paymentService.createPayment.and.returnValue(of({ id: 1 }));

            component.confirmPayment();

            setTimeout(() => {
                expect(component.unpaidOrders().some(o => o.id === mockOrders[0].id)).toBe(false);
                expect(component.paidOrders().some(o => o.id === mockOrders[0].id)).toBe(true);
                done();
            }, 100);
        });
    });

    describe('Money Input Parsing', () => {
        it('should parse numeric cash input', () => {
            component.setCashReceivedFromInput(5000);

            expect(component.cashReceived()).toBe(5000);
        });

        it('should parse string cash input', () => {
            component.setCashReceivedFromInput('5000');

            expect(component.cashReceived()).toBe(5000);
        });

        it('should parse cash input with commas', () => {
            component.setCashReceivedFromInput('5,000');

            expect(component.cashReceived()).toBe(5000);
        });

        it('should parse tip input', () => {
            component.setTipFromInput('500');

            expect(component.tipAmount()).toBe(500);
        });

        it('should parse amount input', () => {
            component.setAmountFromInput('3000');

            expect(component.amount()).toBe(3000);
        });

        it('should parse reference number', () => {
            component.setReferenceFromInput('CARD-REF-123');

            expect(component.referenceNumber()).toBe('CARD-REF-123');
        });

        it('should return 0 for empty input', () => {
            component.setCashReceivedFromInput('');

            expect(component.cashReceived()).toBe(0);
        });

        it('should handle invalid numeric input', () => {
            component.setCashReceivedFromInput('invalid');

            expect(component.cashReceived()).toBe(0);
        });
    });

    describe('Order Status Tracking', () => {
        it('should mark order as paid in map', () => {
            const paymentMap = new Map<number, boolean>();
            paymentMap.set(1, true);
            component.paymentExistsByOrderId.set(paymentMap);

            component.selectedOrder.set(mockOrders[0]);

            expect(component.selectedOrderIsPaid()).toBe(true);
        });

        it('should mark order as unpaid in map', () => {
            const paymentMap = new Map<number, boolean>();
            paymentMap.set(1, false);
            component.paymentExistsByOrderId.set(paymentMap);

            component.selectedOrder.set(mockOrders[0]);

            expect(component.selectedOrderIsPaid()).toBe(false);
        });

        it('should not allow payment for already paid order', () => {
            component.selectedOrder.set(mockOrders[0]);
            const paymentMap = new Map<number, boolean>();
            paymentMap.set(1, true);
            component.paymentExistsByOrderId.set(paymentMap);
            component.paymentMethod.set('cash');
            component.cashReceived.set(mockOrders[0].totalAmount);

            expect(component.isValidPayment()).toBe(false);
        });
    });

    describe('UI State Management', () => {
        it('should show payment form when showing payment form', () => {
            component.selectedOrder.set(mockOrders[0]);
            component.showPaymentForm();

            expect(component.viewState()).toBe('form');
        });

        it('should go back to summary view', () => {
            component.viewState.set('form');
            component.backToSummary();

            expect(component.viewState()).toBe('summary');
        });

        it('should reset payment form on back to summary', () => {
            component.paymentMethod.set('card');
            component.tipAmount.set(500);
            component.viewState.set('form');

            component.backToSummary();

            expect(component.paymentMethod()).toBe('cash');
            expect(component.tipAmount()).toBe(0);
        });
    });

    describe('Error Handling', () => {
        it('should set error message on order load failure', () => {
            orderService.getAllOrdersWithItemNames.and.returnValue(
                throwError(() => new Error('Network error'))
            );

            component.loadUnpaidOrders();
            fixture.detectChanges();

            expect(component.hasError()).toBe(true);
        });

        it('should clear error on retry', () => {
            component.error.set('Previous error');
            orderService.getAllOrdersWithItemNames.and.returnValue(of([]));
            paymentService.getPaymentByOrderId.and.returnValue(of(null));

            component.retry();
            fixture.detectChanges();

            expect(component.error()).toBeNull();
        });

        it('should handle API test', (done) => {
            paymentService.getAllPayments.and.returnValue(of([]));
            spyOn(window, 'alert');

            component.testPaymentAPI();

            setTimeout(() => {
                expect(paymentService.getAllPayments).toHaveBeenCalled();
                done();
            }, 100);
        });
    });

    describe('Relative Time Calculation', () => {
        it('should show "Just now" for recent dates', () => {
            const now = new Date();
            const result = component.getRelativeTime(now.toISOString());

            expect(result).toBe('Just now');
        });

        it('should show minutes ago', () => {
            const fiveMinutesAgo = new Date(Date.now() - 5 * 60000);
            const result = component.getRelativeTime(fiveMinutesAgo.toISOString());

            expect(result).toContain('min ago');
        });

        it('should show hours ago', () => {
            const twoHoursAgo = new Date(Date.now() - 2 * 3600000);
            const result = component.getRelativeTime(twoHoursAgo.toISOString());

            expect(result).toContain('hour');
        });

        it('should show days ago', () => {
            const threeDaysAgo = new Date(Date.now() - 3 * 86400000);
            const result = component.getRelativeTime(threeDaysAgo.toISOString());

            expect(result).toContain('day');
        });
    });
});
