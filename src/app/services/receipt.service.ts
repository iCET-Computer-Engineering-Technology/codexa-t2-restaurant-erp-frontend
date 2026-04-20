import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ReceiptDTO, ReceiptFilterParams } from '../models/receipt.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ReceiptService {
  private apiUrl = `${environment.apiUrl}/receipts`;

  constructor(private http: HttpClient) {}

  //Get all paid orders as receipts
  getAllReceipts(): Observable<ReceiptDTO[]> {
    return this.http.get<ReceiptDTO[]>(this.apiUrl);
  }

  //Get receipt details by order ID
  getReceiptById(orderId: number): Observable<ReceiptDTO> {
    return this.http.get<ReceiptDTO>(`${this.apiUrl}/${orderId}`);
  }


  searchReceipts(
    orderNumber?: string,
    startDate?: Date,
    endDate?: Date
  ): Observable<ReceiptDTO[]> {
    let params = new HttpParams();

    if (orderNumber && orderNumber.trim()) {
      params = params.set('orderNumber', orderNumber.trim());
    }

    if (startDate) {
      const startDateStr = this.formatDateForAPI(startDate);
      params = params.set('startDate', startDateStr);
    }

    if (endDate) {
      const endDateStr = this.formatDateForAPI(endDate);
      params = params.set('endDate', endDateStr);
    }

    return this.http.get<ReceiptDTO[]>(`${this.apiUrl}/search`, { params });
  }

  //Format date to ISO format for API (YYYY-MM-DD)
  private formatDateForAPI(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }


  sendReceiptToEmail(
    orderId: number,
    email: string,
    body: string
  ): Observable<{ success: boolean; message: string }> {
    const payload = {
      orderId,
      email,
      body,
    };
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/${orderId}/send-email`,
      payload
    );
  }
}
