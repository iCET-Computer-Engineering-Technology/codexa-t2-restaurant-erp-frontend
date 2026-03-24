import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

import { KitchenService, Order, Waiter } from '../../../services/kitchen.service';

@Component({
  selector: 'app-order-assign',
  imports: [],
  templateUrl: './order-assign.html',
  styleUrl: './order-assign.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderAssign implements OnInit {
  private readonly kitchenService = inject(KitchenService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<Order[]>([]);
  readonly waiters = signal<Waiter[]>([]);

  ngOnInit(): void {
    this.loadOrders();
    this.loadWaiters();
  }

  loadOrders(): void {
    this.kitchenService
      .getOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((orders) => {
        this.orders.set(orders);
      });
  }

  loadWaiters(): void {
    this.kitchenService
      .getWaiters()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((waiters) => {
        this.waiters.set(waiters);
      });
  }

  assignWaiter(orderId: number, waiterValue: string): void {
    const waiterId = Number(waiterValue);
    if (!Number.isFinite(waiterId) || waiterId === 0) {
      return;
    }
    this.kitchenService
      .assignWaiter(orderId, waiterId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.loadOrders();
      });
  }
}
