import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentService } from './payment.service';
import { PaymentDto } from '../models/payment.model';
import { environment } from '../../environments/environment';

describe('PaymentService - Payment Operations', () => {
    let service: PaymentService;
    let httpMock: HttpTestingController;
    const apiUrl = `${environment.apiUrl}/payments`;

    beforeEach(() => {
        TestBed.configureTestingModule({
            imports: [HttpClientTestingModule],
            providers: [PaymentService]
        });
        service = TestBed.inject(PaymentService);
        httpMock = TestBed.inject(HttpTestingController);
    });

    afterEach(() => {
        httpMock.verify();
    });

    describe('Cash Payment Operations', () => {
        it('should create cash payment for order', (done) => {
            const payment: PaymentDto = {
                orderId: 1,
                paymentMethod: 'CASH',
                amount: 5000,
                tipAmount: 500,
                processedBy: 1
            };

            service.createPayment(payment).subscribe(result => {
                expect(result).toBeDefined();
                done();
            });

            const req = httpMock.expectOne(apiUrl);
            req.flush({ id: 1, ...payment, processedAt: new Date().toISOString() });
        });

        it('should retrieve cash payment by order ID', (done) => {
            const mockPayment: PaymentDto = {
                id: 1,
                orderId: 1,
                paymentMethod: 'CASH',
                amount: 5000
            };

            service.getPaymentByOrderId(1).subscribe(result => {
                expect(result?.paymentMethod).toBe('CASH');
                done();
            });

            const req = httpMock.expectOne(`${apiUrl}/order/1`);
            req.flush(mockPayment);
        });
    });

    describe('Card Payment Operations', () => {
        it('should create card payment with reference number', (done) => {
            const payment: PaymentDto = {
                orderId: 2,
                paymentMethod: 'CARD',
                amount: 3000,
                referenceNumber: 'CARD-REF-123456',
                processedBy: 1
            };

            service.createPayment(payment).subscribe(result => {
                expect(result.referenceNumber).toBe('CARD-REF-123456');
                done();
            });

            const req = httpMock.expectOne(apiUrl);
            req.flush({ id: 2, ...payment, processedAt: new Date().toISOString() });
        });
    });

    describe('Payment Retrieval', () => {
        it('should get all payments', (done) => {
            const mockPayments: PaymentDto[] = [
                { id: 1, orderId: 1, paymentMethod: 'CASH', amount: 5000 },
                { id: 2, orderId: 2, paymentMethod: 'CARD', amount: 3000 }
            ];

            service.getAllPayments().subscribe(result => {
                expect(result.length).toBe(2);
                done();
            });

            const req = httpMock.expectOne(apiUrl);
            req.flush(mockPayments);
        });

        it('should handle 404 when payment not found', (done) => {
            service.getPaymentByOrderId(999).subscribe(result => {
                expect(result).toBeNull();
                done();
            });

            const req = httpMock.expectOne(`${apiUrl}/order/999`);
            req.flush(null, { status: 404, statusText: 'Not Found' });
        });
    });

    describe('Error Handling', () => {
        it('should handle server errors', (done) => {
            service.getAllPayments().subscribe(
                () => expect(false).toBe(true),
                (error) => {
                    expect(error.status).toBe(500);
                    done();
                }
            );

            const req = httpMock.expectOne(apiUrl);
            req.flush('Server error', { status: 500, statusText: 'Server Error' });
        });
    });

    describe('Payment with Tips', () => {
        it('should include tip amount in payment', (done) => {
            const payment: PaymentDto = {
                orderId: 1,
                paymentMethod: 'CASH',
                amount: 5000,
                tipAmount: 500,
                processedBy: 1
            };

            service.createPayment(payment).subscribe(() => {
                done();
            });

            const req = httpMock.expectOne(apiUrl);
            expect(req.request.body.tipAmount).toBe(500);
            req.flush({ id: 1, ...payment });
        });
    });
});
