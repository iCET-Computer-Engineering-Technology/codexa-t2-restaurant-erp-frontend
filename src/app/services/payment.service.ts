import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { PaymentDto } from '../models/payment.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PaymentService {
  private apiUrl = `${environment.apiUrl}/payments`;

  constructor(private http: HttpClient) {}

  /**
   * Get payment by order ID
   * Returns null if no payment found (404)
   */
  getPaymentByOrderId(orderId: number): Observable<PaymentDto | null> {
    return this.http.get<PaymentDto>(`${this.apiUrl}/order/${orderId}`).pipe(
      catchError(error => {
        // 404 means no payment exists - this is expected for unpaid orders
        if (error.status === 404) {
          return of(null);
        }
        throw error;
      })
    );
  }

  /**
   * Create a new payment
   */
  createPayment(payment: PaymentDto): Observable<any> {
    return this.http.post(this.apiUrl, payment);
  }

  /**
   * Get all payments
   */
  getAllPayments(): Observable<PaymentDto[]> {
    return this.http.get<PaymentDto[]>(this.apiUrl);
  }
}
