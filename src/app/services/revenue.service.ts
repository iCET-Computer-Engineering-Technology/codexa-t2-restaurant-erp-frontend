import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface RevenueData {
  channelType: string;
  totalRevenue: number;
}

export interface ReconciliationResponse {
  status: string;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class RevenueService {

  private apiUrl = 'http://localhost:8080/api'; 

  constructor(private http: HttpClient) { }

  getDailyRevenue(date: string): Observable<RevenueData[]> {
    return this.http.get<RevenueData[]>(`${this.apiUrl}/revenue/daily-split?date=${date}`);
  }

  getWeeklyRevenue(): Observable<RevenueData[]> {
    return this.http.get<RevenueData[]>(`${this.apiUrl}/revenue/weekly-split`);
  }

  runReconciliation(): Observable<string> {
    return this.http.post<string>(`${this.apiUrl}/reconciliation/run`, {});
  }

  performDailyReconciliation(): Observable<string> {
    return this.http.get<string>(`${this.apiUrl}/reconciliation/daily`);
  }
}