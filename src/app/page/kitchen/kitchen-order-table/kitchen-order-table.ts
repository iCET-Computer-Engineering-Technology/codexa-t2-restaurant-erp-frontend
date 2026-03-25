import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { KitchenService, Order } from '../../../services/kitchen.service';

@Component({
  selector: 'app-kitchen-order-table',
  imports: [CommonModule],
  templateUrl: './kitchen-order-table.html',
  styleUrl: './kitchen-order-table.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenOrderTable implements OnInit {
  private readonly kitchenService = inject(KitchenService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<Order[]>([]);

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.kitchenService
      .getOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((orders) => {
        this.orders.set(orders);
      });
  }
}