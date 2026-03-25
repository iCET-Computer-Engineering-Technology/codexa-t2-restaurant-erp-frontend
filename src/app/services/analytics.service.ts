import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  private base = 'http://localhost:8080/api/campaign-analytics';

  constructor(private http: HttpClient) {}

  getAllMetrics(): Observable<any> {
    return this.http.get<any>(`${this.base}/metrics/all`);
  }

  getCampaignMetrics(campaignId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${campaignId}/metrics`);
  }

  getMetricsByDateRange(campaignId: number, startDate: string, endDate: string): Observable<any> {
    const params = new HttpParams().set('startDate', startDate).set('endDate', endDate);
    return this.http.get<any>(`${this.base}/${campaignId}/metrics/date-range`, { params });
  }

  getCampaignAnalytics(campaignId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${campaignId}/all`);
  }

  getCustomerAnalytics(campaignId: number, customerId: number): Observable<any> {
    return this.http.get<any>(`${this.base}/${campaignId}/customer/${customerId}`);
  }

  recordSent(campaignId: number, customerId: number, variant = 'A'): Observable<any> {
    const params = new HttpParams().set('customerId', customerId).set('variant', variant);
    return this.http.post<any>(`${this.base}/${campaignId}/record-sent`, {}, { params });
  }

  recordOpen(campaignId: number, customerId: number): Observable<any> {
    const params = new HttpParams().set('customerId', customerId);
    return this.http.post<any>(`${this.base}/${campaignId}/record-open`, {}, { params });
  }

  recordClick(campaignId: number, customerId: number): Observable<any> {
    const params = new HttpParams().set('customerId', customerId);
    return this.http.post<any>(`${this.base}/${campaignId}/record-click`, {}, { params });
  }

  recordConversion(campaignId: number, customerId: number): Observable<any> {
    const params = new HttpParams().set('customerId', customerId);
    return this.http.post<any>(`${this.base}/${campaignId}/record-conversion`, {}, { params });
  }

  recordUnsubscribe(campaignId: number, customerId: number): Observable<any> {
    const params = new HttpParams().set('customerId', customerId);
    return this.http.post<any>(`${this.base}/${campaignId}/record-unsubscribe`, {}, { params });
  }

  deleteAnalytics(campaignId: number): Observable<any> {
    return this.http.delete<any>(`${this.base}/${campaignId}/delete-analytics`);
  }
}