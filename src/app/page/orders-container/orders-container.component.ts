import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderPlacementComponent } from '../order-placement/order-placement.component';
import { ViewOrdersComponent } from '../view-orders/view-orders.component';
import { PaymentsComponent } from '../payments/payments.component';

type OrderTab = 'placement' | 'view-orders' | 'payments' | 'receipts';

@Component({
  selector: 'app-orders-container',
  imports: [CommonModule, OrderPlacementComponent, ViewOrdersComponent, PaymentsComponent],
  templateUrl: './orders-container.component.html',
  styleUrls: ['./orders-container.component.css']
})
export class OrdersContainerComponent {
  readonly activeTab = signal<OrderTab>('placement');

  selectTab(tab: OrderTab): void {
    this.activeTab.set(tab);
  }
}
