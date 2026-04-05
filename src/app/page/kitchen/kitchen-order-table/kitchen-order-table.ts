import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

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
  readonly searchTerm = signal('');
  readonly loading = signal(false);
  readonly hasLoadError = signal(false);
  readonly markingReadyOrderIds = signal<number[]>([]);

  readonly filteredOrders = computed(() => {
    const keyword = this.searchTerm().trim().toLowerCase();
    if (!keyword) {
      return this.orders();
    }

    return this.orders().filter((order) => {
      return (
        order.orderNumber.toLowerCase().includes(keyword) ||
        String(order.tableId).includes(keyword) ||
        String(order.id).includes(keyword)
      );
    });
  });

  ngOnInit(): void {
    this.loadOrders();
  }

  loadOrders(): void {
    this.loading.set(true);
    this.hasLoadError.set(false);

    this.kitchenService
      .getOrders()
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

  setSearchTerm(value: string): void {
    this.searchTerm.set(value);
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

  markReady(order: Order): void {
    if (order.status === 'READY' || this.isMarkingReady(order.id)) {
      return;
    }

    this.markingReadyOrderIds.update((ids) => [...ids, order.id]);

    this.kitchenService
      .updateOrderStatus(order.id, 'READY')
      .pipe(takeUntilDestroyed(this.destroyRef))
      .pipe(finalize(() => this.markingReadyOrderIds.update((ids) => ids.filter((id) => id !== order.id))))
      .subscribe(() => {
        this.kitchenService.recordReadyOrder({
          ...order,
          status: 'READY',
          isSentToKitchen: true,
        });

        this.orders.update((orders) =>
          orders.map((item) =>
            item.id === order.id
              ? {
                  ...item,
                  status: 'READY',
                }
              : item
          )
        );
      });
  }

  isMarkingReady(orderId: number): boolean {
    return this.markingReadyOrderIds().includes(orderId);
  }
}