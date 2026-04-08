import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule, HttpTestingController } from '@angular/common/http/testing';
import { PaymentService } from './payment.service';
import { PaymentDto } from '../models/payment.model';
import { environment } from '../../environments/environment';

describe('PaymentService - All Payment Functions Test Suite', () => {
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

    describe('getPaymentByOrderId - Retrieve Payment Status', () => {
        it('should successfully retrieve payment for a given order ID', (done) => {
            const orderId = 1;
            const mockPayment: PaymentDto = {
                id: 1,
                orderId: orderId,
                paymentMethod: 'CASH',
                amount: 5000,
                tipAmount: 100,
                processedAt: new Date().toISOString()
            };

            service.getPaymentByOrderId(orderId).subscribe(payment => {
                expect(payment).toEqual(mockPayment);
                expect(payment?.paymentMethod).toBe('CASH');
                expect(payment?.amount).toBe(5000);
                done();
            });

            const req = httpMock.expectOne(`${apiUrl}/order/${orderId}`);
            expect(req.request.method).toBe('GET');
            req.flush(mockPayment);
        });

        it('should return null when payment not found 404 status', (done) => {
            const orderId = 999;

            service.getPaymentByOrderId(orderId).subscribe(payment => {
                expect(payment).toBeNull();
                done();
            });

            const req = httpMock.expectOne(`${apiUrl}/order/${orderId}`);
            req.flush(null, { status: 404, statusText: 'Not Found' });
        });

        it('should throw error for non-404 server errors', (done) => {
            const orderId = 1;

            service.getPaymentByOrderId(orderId).subscribe(
                () => done.fail('should have thrown error'),
                (error) => {
                    expect(error.status).toBe(500);
                    done();
                }
            );

            const req = httpMock.expectOne(`${apiUrl}/order/${orderId}`);
            req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
        });
    });

    describe('createPayment - Process Different Payment Methods', () => {
        it('should create a new CASH payment successfully', (done) => {
            const paymentData: PaymentDto = {
                orderId: 1,
                paymentMethod: 'CASH',
                amount: 5000,
                tipAmount: 100,
                processedBy: 1
            };

            const mockResponse = { id: 1, ...paymentData, processedAt: new Date().toISOString() };

            service.createPayment(paymentData).subscribe(response => {
                expect(response.id).toBe(1);
                expect(response.paymentMethod).toBe('CASH');
                expect(response.amount).toBe(5000);
                expect(response.tipAmount).toBe(100);
                done();
            });

            const req = httpMock.expectOne(apiUrl);
            expect(req.request.method).toBe('POST');
            expect(req.request.body).toEqual(paymentData);
            req.flush(mockResponse);
        });

        it('should create a new CARD payment with reference number', (done) => {
            const paymentData: PaymentDto = {
                orderId: 2,
                paymentMethod: 'CARD',
                amount: 3000,
                referenceNumber: 'CARD-REF-12345',
                processedBy: 1
            };

            const mockResponse = { id: 2, ...paymentData, processedAt: new Date().toISOString() };

            service.createPayment(paymentData).subscribe(response => {
                expect(response.paymentMethod).toBe('CARD');
                expect(response.referenceNumber).toBe('CARD-REF-12345');
                expect(response.amount).toBe(3000);
                done();
            });

            const req = httpMock.expectOne(apiUrl);
            expect(req.request.method).toBe('POST');
            req.flush(mockResponse);
        });

        it('should handle payment creation error bad request', (done) => {
            const paymentData: PaymentDto = {
                orderId: 1,
                paymentMethod: 'CASH',
                amount: 5000
            };

            service.createPayment(paymentData).subscribe(
                () => done.fail('should have thrown error'),
                (error) => {
                    expect(error.status).toBe(400);
                    done();
                }
            );

            const req = httpMock.expectOne(apiUrl);
            req.flush('Invalid payment data', { status: 400, statusText: 'Bad Request' });
        });

        it('should include tip amount in payment request', (done) => {
            const paymentData: PaymentDto = {
                orderId: 1,
                paymentMethod: 'CASH',
                amount: 5000,
                tipAmount: 500,
                processedBy: 1
            };

            service.createPayment(paymentData).subscribe(() => {
                done();
            });

            const req = httpMock.expectOne(apiUrl);
            expect(req.request.body.tipAmount).toBe(500);
            req.flush({ id: 1, ...paymentData });
        });
    });

    describe('getAllPayments - Retrieve All Payment Records', () => {
        it('should retrieve all payments from the system', (done) => {
            const mockPayments: PaymentDto[] = [
                { id: 1, orderId: 1, paymentMethod: 'CASH', amount: 5000 },
                { id: 2, orderId: 2, paymentMethod: 'CARD', amount: 3000, referenceNumber: 'REF-123' },
                { id: 3, orderId: 3, paymentMethod: 'CASH', amount: 2500, tipAmount: 250 }
            ];

            service.getAllPayments().subscribe(payments => {
                expect(payments.length).toBe(3);
                expect(payments).toEqual(mockPayments);
                done();
            });

            const req = httpMock.expectOne(apiUrl);
            expect(req.request.method).toBe('GET');
            req.flush(mockPayments);
        });

        it('should return empty array when no payments exist', (done) => {
            service.getAllPayments().subscribe(payments => {
                expect(payments).toEqual([]);
                expect(payments.length).toBe(0);
                done();
            });

            const req = httpMock.expectOne(apiUrl);
            req.flush([]);
        });

        it('should handle error when fetching all payments', (done) => {
            service.getAllPayments().subscribe(
                () => done.fail('should have thrown error'),
                (error) => {
                    expect(error.status).toBe(500);
                    done();
                }
            );

            const req = httpMock.expectOne(apiUrl);
            req.flush('Server error', { status: 500, statusText: 'Internal Server Error' });
        });
    });
});
