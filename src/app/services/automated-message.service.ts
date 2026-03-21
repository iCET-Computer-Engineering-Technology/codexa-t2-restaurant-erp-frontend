import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AutomatedMessage, SendEmailRequest } from '../models/automated-message.model';

@Injectable({ providedIn: 'root' })
export class AutomatedMessageService {
  private readonly base = 'http://localhost:8080/api/admin/automated-messages';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<AutomatedMessage[]> {
    return this.http.get<AutomatedMessage[]>(this.base);
  }

  getInactive(): Observable<AutomatedMessage[]> {
    return this.http.get<AutomatedMessage[]>(`${this.base}/inactive`);
  }

  getById(id: number): Observable<AutomatedMessage> {
    return this.http.get<AutomatedMessage>(`${this.base}/${id}`);
  }

  getByTriggerType(triggerType: string): Observable<AutomatedMessage[]> {
    return this.http.get<AutomatedMessage[]>(`${this.base}/trigger/${triggerType}`);
  }

  create(msg: AutomatedMessage): Observable<number> {
    return this.http.post<number>(this.base, msg);
  }

  update(id: number, msg: AutomatedMessage): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}`, msg);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  toggleStatus(id: number): Observable<void> {
    return this.http.put<void>(`${this.base}/${id}/toggle`, {});
  }

  sendTestEmail(toEmail: string): Observable<any> {
    const params = new HttpParams().set('toEmail', toEmail);
    return this.http.post<any>(`${this.base}/test-email`, {}, { params });
  }

  sendToAll(req: SendEmailRequest): Observable<any> {
    return this.http.post<any>(`${this.base}/send-to-all`, req);
  }

  sendBirthday(req: SendEmailRequest): Observable<any> {
    return this.http.post<any>(`${this.base}/send-birthday`, req);
  }

  sendAnniversary(req: SendEmailRequest): Observable<any> {
    return this.http.post<any>(`${this.base}/send-anniversary`, req);
  }

  debugCustomerStatus(): Observable<any> {
    return this.http.get<any>(`${this.base}/debug/customer-status`);
  }
}