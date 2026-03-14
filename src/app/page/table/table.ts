import { Component } from '@angular/core';
import { CommonModule, NgFor } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-table',
  templateUrl: './table.html',
  styleUrls: ['./table.css'],
  standalone: true,
  imports: [CommonModule, NgFor, HttpClientModule] 
})
export class Table {
  orderList: Array<any> = [];

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.getUnservedOrders();
  }
  
  getUnservedOrders() {
    this.http.get<any[]>("http://localhost:8080/api/waiter/unserved")
      .subscribe(data => this.orderList = data);
  }

  serveOrder(orderId: number) {
    this.http.put(`http://localhost:8080/api/waiter/${orderId}`, {})
      .subscribe(() => {
        alert("Order " + orderId + " served");
        this.getUnservedOrders();
      });
  }
}