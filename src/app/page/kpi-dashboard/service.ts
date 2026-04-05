import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface OrderItem {
    id: number;
    orderId: number;
    menuItemId: number;
    itemName: string;
    portionId: number;
    quantity: number;
    price: number;
    lineTotal: number;
    status: string;
    notes: string;
    createdAt: string;
}

export interface OrderResponse {
    id: number;
    orderTypeId: number;
    orderNumber: string;
    orderType: string;
    tableId: number;
    customerId: number;
    serverId: number;
    status: string;
    subTotal: number;
    discountAmount: number;
    taxAmount: number;
    serviceCharge: number;
    totalAmount: number;
    notes: string;
    createdAt: string;
    updatedAt: string;
    items: OrderItem[];
}

export interface RestaurantTable {
    id: number;
    tableNumber: string;
    capacity: number;
    status: string;
}

@Injectable({
    providedIn: 'root'
})
export class Service {
    private readonly http = inject(HttpClient);
    private readonly apiUrl1 = 'http://localhost:8080/api/order/find-all-with-item-names';
    private readonly apiUrl2 = 'http://localhost:8080/api/tables';

    getOrders(): Observable<OrderResponse[]> {
        return this.http.get<OrderResponse[]>(this.apiUrl1);
    }

    getTables(): Observable<RestaurantTable[]> {
        return this.http.get<RestaurantTable[]>(this.apiUrl2);
    }
}