// src/app/services/kitchen/service.ts
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class KitchenService {

  private api = 'http://localhost:8080/api/kitchen';

  constructor(private http: HttpClient) {}

  getOrders(): Observable<any> {
    return this.http.get(`${this.api}/orders`);
  }

  getWaiters(): Observable<any> {
    return this.http.get(`${this.api}/waiters`);
  }

  assignWaiter(data: any): Observable<any> {
    return this.http.post(`${this.api}/assign`, data);
  }
}