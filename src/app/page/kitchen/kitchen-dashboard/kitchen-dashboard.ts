import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { KitchenService, Order } from '../../../services/kitchen.service';

@Component({
  selector: 'app-kitchen-dashboard',
  imports: [CommonModule],
  templateUrl: './kitchen-dashboard.html',
  styleUrl: './kitchen-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class KitchenDashboard {
  private readonly kitchenService = inject(KitchenService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(true);
  readonly hasLoadError = signal(false);
  readonly sendingOrderIds = signal<number[]>([]);

  readonly totalOrders = computed(() => this.orders().length);
  readonly receivedCount = computed(
    () => this.orders().filter((order) => order.status === 'RECEIVED').length
  );
  readonly preparingCount = computed(
    () => this.orders().filter((order) => order.status === 'PREPARING').length
  );
  readonly readyCount = computed(
    () => this.orders().filter((order) => order.status === 'READY').length
  );
  readonly recentOrders = computed(() => this.orders().slice(0, 5));

  constructor() {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.hasLoadError.set(false);

    this.kitchenService
      .getDashboardOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders);
          this.loading.set(false);
        },
        error: () => {
          this.hasLoadError.set(true);
          this.loading.set(false);
        },
      });
  }

  statusClass(status: string): string {
    if (status === 'READY') {
      return 'bg-green-100 text-green-700';
    }
    if (status === 'PREPARING') {
      return 'bg-blue-100 text-blue-700';
    }
    return 'bg-yellow-100 text-yellow-700';
  }

  dotClass(status: string): string {
    if (status === 'READY') {
      return 'bg-green-500';
    }
    if (status === 'PREPARING') {
      return 'bg-blue-500';
    }
    return 'bg-yellow-500';
  }

  isSending(orderId: number): boolean {
    return this.sendingOrderIds().includes(orderId);
  }

  sendToKitchen(order: Order): void {
    if (order.isSentToKitchen || this.isSending(order.id)) {
      return;
    }

    this.sendingOrderIds.update((ids) => [...ids, order.id]);

    this.kitchenService
      .sendToKitchen(order.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .pipe(finalize(() => this.sendingOrderIds.update((ids) => ids.filter((id) => id !== order.id))))
      .subscribe({
        next: () => {
          this.orders.update((orders) =>
            orders.map((item) =>
              item.id === order.id
                ? {
                    ...item,
                    isSentToKitchen: true,
                    status: 'RECEIVED',
                  }
                : item
            )
          );
        },
        error: () => {},
      });
  }

}
