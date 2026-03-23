import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

import { environment } from '../../environments/environment';

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  tableId: number;
  orderNumber: string;
  status: string;
  items: OrderItem[];
}

export interface Waiter {
  id: number;
  name: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class KitchenService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;

  getOrders(): Observable<Order[]> {
    return this.http.get<Order[]>(`${this.api}/kitchen/orders`);
  }

  getWaiters(): Observable<Waiter[]> {
    return this.http.get<Waiter[]>(`${this.api}/kitchen/waiters`);
  }

  assignWaiter(orderId: number, waiterId: number): Observable<void> {
    return this.http.post<void>(`${this.api}/kitchen/assign`, { orderId, waiterId });
  }
}
