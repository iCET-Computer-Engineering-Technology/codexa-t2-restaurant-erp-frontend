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

        it('should initialize signals with default values', () => {
            expect(component.orderListFilter()).toBe('unpaid');
            expect(component.viewState()).toBe('summary');
            expect(component.paymentMethod()).toBe('cash');
            expect(component.isLoading()).toBe(false);
        });
    });

    describe('Order Loading and Filtering', () => {
        it('should handle empty orders gracefully', () => {
            orderService.getAllOrdersWithItemNames.and.returnValue(of([]));

            component.loadUnpaidOrders();
            fixture.detectChanges();

            expect(component.hasOrders()).toBe(false);
        });

        it('should filter orders by unpaid status', () => {
            const testOrder1: OrderWithItemNameResponse = { id: 1, orderNumber: 'ORD-1', items: [], totalAmount: 3000, createdAt: new Date().toISOString(), status: 'pending' } as any;
            const testOrder2: OrderWithItemNameResponse = { id: 2, orderNumber: 'ORD-2', items: [], totalAmount: 5000, createdAt: new Date().toISOString(), status: 'pending' } as any;

            component.allOrders.set([testOrder1, testOrder2]);
            component.unpaidOrders.set([testOrder1]);
            component.paidOrders.set([testOrder2]);
            component.orderListFilter.set('unpaid');

            expect(component.filteredOrders()).toEqual([testOrder1]);
        });

        it('should filter orders by paid status', () => {
            const testOrder1: OrderWithItemNameResponse = { id: 1, orderNumber: 'ORD-1', items: [], totalAmount: 3000, createdAt: new Date().toISOString(), status: 'pending' } as any;
            const testOrder2: OrderWithItemNameResponse = { id: 2, orderNumber: 'ORD-2', items: [], totalAmount: 5000, createdAt: new Date().toISOString(), status: 'pending' } as any;

            component.allOrders.set([testOrder1, testOrder2]);
            component.unpaidOrders.set([testOrder1]);
            component.paidOrders.set([testOrder2]);
            component.orderListFilter.set('paid');

            expect(component.filteredOrders()).toEqual([testOrder2]);
        });

        it('should show all orders when filter is all', () => {
            const testOrder1: OrderWithItemNameResponse = { id: 1, orderNumber: 'ORD-1', items: [], totalAmount: 3000, createdAt: new Date().toISOString(), status: 'pending' } as any;
            const testOrder2: OrderWithItemNameResponse = { id: 2, orderNumber: 'ORD-2', items: [], totalAmount: 5000, createdAt: new Date().toISOString(), status: 'pending' } as any;

            component.allOrders.set([testOrder1, testOrder2]);
            component.unpaidOrders.set([testOrder1]);
            component.paidOrders.set([testOrder2]);
            component.orderListFilter.set('all');

            expect(component.filteredOrders()).toEqual([testOrder1, testOrder2]);
        });
    });

    describe('Order Selection', () => {
        it('should select an order', () => {
            const testOrder: OrderWithItemNameResponse = { id: 1, orderNumber: 'ORD-1', items: [], totalAmount: 3000, createdAt: new Date().toISOString(), status: 'pending' } as any;
            component.selectOrder(testOrder);

            expect(component.selectedOrder()).toEqual(testOrder);
            expect(component.viewState()).toBe('summary');
        });

        it('should reset payment form when selecting order', () => {
            const testOrder: OrderWithItemNameResponse = { id: 1, orderNumber: 'ORD-1', items: [], totalAmount: 3000, createdAt: new Date().toISOString(), status: 'pending' } as any;
            component.paymentMethod.set('card');
            component.tipAmount.set(500);
            component.referenceNumber.set('REF-123');

            component.selectOrder(testOrder);

            expect(component.paymentMethod()).toBe('cash');
            expect(component.tipAmount()).toBe(0);
            expect(component.referenceNumber()).toBe('');
        });

        it('should deselect order when selecting null', () => {
            const testOrder: OrderWithItemNameResponse = { id: 1, orderNumber: 'ORD-1', items: [], totalAmount: 3000, createdAt: new Date().toISOString(), status: 'pending' } as any;
            component.selectedOrder.set(testOrder);
            component.selectOrder(null as any);

            expect(component.selectedOrder()).toBeNull();
        });
    });

    describe('Payment Method Selection', () => {
        let testOrder: OrderWithItemNameResponse;

        beforeEach(() => {
            testOrder = { id: 1, orderNumber: 'ORD-1', items: [], totalAmount: 5000, createdAt: new Date().toISOString(), status: 'pending' } as any;
            component.selectedOrder.set(testOrder);
        });

        it('should select cash payment method', () => {
            component.selectPaymentMethod('cash');

            expect(component.paymentMethod()).toBe('cash');
            expect(component.cashReceived()).toBe(testOrder.totalAmount);
        });

        it('should select card payment method', () => {
            component.selectPaymentMethod('card');

            expect(component.paymentMethod()).toBe('card');
            expect(component.amount()).toBe(testOrder.totalAmount);
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
        let testOrder: OrderWithItemNameResponse;

        beforeEach(() => {
            testOrder = { id: 1, orderNumber: 'ORD-1', items: [], totalAmount: 5000, createdAt: new Date().toISOString(), status: 'pending' } as any;
            component.selectedOrder.set(testOrder);
            component.paymentMethod.set('cash');
        });

        it('should validate cash payment when exact amount is paid', () => {
            component.cashReceived.set(testOrder.totalAmount);

            expect(component.isValidPayment()).toBe(true);
        });

        it('should validate cash payment when more than amount is paid', () => {
            component.cashReceived.set(testOrder.totalAmount + 1000);

            expect(component.isValidPayment()).toBe(true);
        });

        it('should reject cash payment when insufficient amount is paid', () => {
            component.cashReceived.set(testOrder.totalAmount - 1000);

            expect(component.isValidPayment()).toBe(false);
        });

        it('should calculate change for cash payment', () => {
            const received = testOrder.totalAmount + 1000;
            component.cashReceived.set(received);

            const expectedChange = received - testOrder.totalAmount;
            expect(component.changeAmount()).toBe(expectedChange);
        });

        it('should return zero change when exact amount is paid', () => {
            component.cashReceived.set(testOrder.totalAmount);

            expect(component.changeAmount()).toBe(0);
        });
    });

    describe('Card Payment Validation', () => {
        let testOrder: OrderWithItemNameResponse;

        beforeEach(() => {
            testOrder = { id: 1, orderNumber: 'ORD-1', items: [], totalAmount: 5000, createdAt: new Date().toISOString(), status: 'pending' } as any;
            component.selectedOrder.set(testOrder);
            component.paymentMethod.set('card');
        });

        it('should validate card payment with reference number', () => {
            component.amount.set(testOrder.totalAmount);
            component.referenceNumber.set('CARD-REF-12345');

            expect(component.isValidPayment()).toBe(true);
        });

        it('should reject card payment without reference number', () => {
            component.amount.set(testOrder.totalAmount);
            component.referenceNumber.set('');

            expect(component.isValidPayment()).toBe(false);
        });

        it('should reject card payment with insufficient amount', () => {
            component.amount.set(testOrder.totalAmount - 1000);
            component.referenceNumber.set('CARD-REF-12345');

            expect(component.isValidPayment()).toBe(false);
        });

        it('should reject card payment when only whitespace in reference', () => {
            component.amount.set(testOrder.totalAmount);
            component.referenceNumber.set('   ');

            expect(component.isValidPayment()).toBe(false);
        });
    });

    describe('Mixed Payment Validation', () => {
        let testOrder: OrderWithItemNameResponse;

        beforeEach(() => {
            testOrder = { id: 1, orderNumber: 'ORD-1', items: [], totalAmount: 5000, createdAt: new Date().toISOString(), status: 'pending' } as any;
            component.selectedOrder.set(testOrder);
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

            const remaining = testOrder.totalAmount - 4000;
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
        let testOrder: OrderWithItemNameResponse;

        beforeEach(() => {
            authService.getUserId.and.returnValue(1);
            testOrder = { id: 1, orderNumber: 'ORD-1', items: [], totalAmount: 5000, createdAt: new Date().toISOString(), status: 'pending' } as any;
            component.selectedOrder.set(testOrder);
        });

        it('should confirm cash payment successfully', (done) => {
            component.paymentMethod.set('cash');
            component.cashReceived.set(testOrder.totalAmount);
            paymentService.createPayment.and.returnValue(of({ id: 1 }));

            component.confirmPayment();

            setTimeout(() => {
                expect(paymentService.createPayment).toHaveBeenCalled();
                const callArgs = paymentService.createPayment.calls.mostRecent().args[0];
                expect(callArgs.paymentMethod).toBe('CASH');
                expect(callArgs.amount).toBe(testOrder.totalAmount);
                done();
            }, 100);
        });

        it('should confirm card payment with reference number', (done) => {
            component.paymentMethod.set('card');
            component.amount.set(testOrder.totalAmount);
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
            component.cashReceived.set(testOrder.totalAmount + 500);
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
            component.cashReceived.set(testOrder.totalAmount);
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
            component.unpaidOrders.set([testOrder]);
            component.paidOrders.set([]);
            component.paymentMethod.set('cash');
            component.cashReceived.set(testOrder.totalAmount);
            paymentService.createPayment.and.returnValue(of({ id: 1 }));

            component.confirmPayment();

            setTimeout(() => {
                expect(component.unpaidOrders().some(o => o.id === testOrder.id)).toBe(false);
                expect(component.paidOrders().some(o => o.id === testOrder.id)).toBe(true);
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

            const testOrder: OrderWithItemNameResponse = { id: 1, orderNumber: 'ORD-1', items: [], totalAmount: 3000, createdAt: new Date().toISOString(), status: 'pending' } as any;
            component.selectedOrder.set(testOrder);

            expect(component.selectedOrderIsPaid()).toBe(true);
        });

        it('should mark order as unpaid in map', () => {
            const paymentMap = new Map<number, boolean>();
            paymentMap.set(1, false);
            component.paymentExistsByOrderId.set(paymentMap);

            const testOrder: OrderWithItemNameResponse = { id: 1, orderNumber: 'ORD-1', items: [], totalAmount: 3000, createdAt: new Date().toISOString(), status: 'pending' } as any;
            component.selectedOrder.set(testOrder);

            expect(component.selectedOrderIsPaid()).toBe(false);
        });

        it('should not allow payment for already paid order', () => {
            const testOrder: OrderWithItemNameResponse = { id: 1, orderNumber: 'ORD-1', items: [], totalAmount: 5000, createdAt: new Date().toISOString(), status: 'pending' } as any;
            component.selectedOrder.set(testOrder);
            const paymentMap = new Map<number, boolean>();
            paymentMap.set(1, true);
            component.paymentExistsByOrderId.set(paymentMap);
            component.paymentMethod.set('cash');
            component.cashReceived.set(testOrder.totalAmount);

            expect(component.isValidPayment()).toBe(false);
        });
    });

    describe('UI State Management', () => {
        it('should show payment form when showing payment form', () => {
            const testOrder: OrderWithItemNameResponse = { id: 1, orderNumber: 'ORD-1', items: [], totalAmount: 3000, createdAt: new Date().toISOString(), status: 'pending' } as any;
            component.selectedOrder.set(testOrder);
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
