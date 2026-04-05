import { ChangeDetectionStrategy, Component, DestroyRef, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { finalize } from 'rxjs';

import { KitchenService, Order, Waiter } from '../../../services/kitchen.service';

@Component({
  selector: 'app-order-assign',
  imports: [CommonModule],
  templateUrl: './order-assign.html',
  styleUrl: './order-assign.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderAssign implements OnInit {
  private readonly kitchenService = inject(KitchenService);
  private readonly destroyRef = inject(DestroyRef);

  readonly orders = signal<Order[]>([]);
  readonly waiters = signal<Waiter[]>([]);
  readonly loadingOrders = signal(false);
  readonly loadingWaiters = signal(false);
  readonly hasLoadError = signal(false);
  readonly assigningKitchenOrderIds = signal<number[]>([]);

  ngOnInit(): void {
    this.loadOrders();
    this.loadWaiters();
  }

  loadOrders(): void {
    this.loadingOrders.set(true);
    this.hasLoadError.set(false);

    this.kitchenService
      .getOrders()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (orders) => {
          this.orders.set(orders.filter((order) => this.isReadyForAssign(order.status)));
          this.loadingOrders.set(false);
        },
        error: () => {
          this.hasLoadError.set(true);
          this.loadingOrders.set(false);
        },
      });
  }

  loadWaiters(): void {
    this.loadingWaiters.set(true);

    this.kitchenService
      .getWaiters()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (waiters) => {
          this.waiters.set(waiters);
          this.loadingWaiters.set(false);
        },
        error: () => {
          this.loadingWaiters.set(false);
        },
      });
  }

  assignWaiter(order: Order, waiterValue: string): void {
    const waiterId = Number(waiterValue);
    const kitchenOrderId = order.kitchenOrderId;

    if (!this.canAssignOrder(order) || !Number.isFinite(waiterId) || waiterId === 0 || kitchenOrderId == null) {
      return;
    }

    this.setAssigning(kitchenOrderId, true);

    this.kitchenService
      .assignWaiter(kitchenOrderId, waiterId)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .pipe(finalize(() => this.setAssigning(kitchenOrderId, false)))
      .subscribe(() => {
        const waiter = this.waiters().find((item) => item.id === waiterId);
        this.markOrderAsAssigned(order.id, waiterId, waiter?.name);
        this.loadOrders();
      });
  }

  isOrderAssigned(order: Order): boolean {
    const hasWaiterId = Number.isFinite(order.waiterId) && Number(order.waiterId) > 0;
    const hasWaiterName = (order.waiterName?.trim().length ?? 0) > 0;
    return hasWaiterId || hasWaiterName;
  }

  canAssignOrder(order: Order): boolean {
    return order.kitchenOrderId != null && !this.isOrderAssigned(order) && !this.isAssigning(order);
  }

  isAssigning(order: Order): boolean {
    const kitchenOrderId = Number(order.kitchenOrderId);
    return Number.isFinite(kitchenOrderId) && this.assigningKitchenOrderIds().includes(kitchenOrderId);
  }

  selectedWaiterValue(order: Order): string {
    const waiterId = Number(order.waiterId);
    if (Number.isFinite(waiterId) && waiterId > 0) {
      return String(waiterId);
    }

    const waiterName = order.waiterName?.trim();
    return waiterName ? `assigned:${waiterName}` : '';
  }

  needsAssignedFallbackOption(order: Order): boolean {
    if (!this.isOrderAssigned(order)) {
      return false;
    }

    const waiterId = Number(order.waiterId);
    if (!Number.isFinite(waiterId) || waiterId <= 0) {
      return true;
    }

    return !this.waiters().some((waiter) => waiter.id === waiterId);
  }

  assignedWaiterName(order: Order): string {
    if (order.waiterName && order.waiterName.trim().length > 0) {
      return order.waiterName;
    }

    if (order.waiterId == null) {
      return 'Unassigned';
    }

    const waiter = this.waiters().find((item) => item.id === order.waiterId);
    return waiter?.name ?? 'Unassigned';
  }

  private isReadyForAssign(status: string): boolean {
    const normalized = status.trim().toUpperCase();
    return normalized === 'READY' || normalized === 'PARTIALLY_READY' || normalized === 'PARTICALLY_READY';
  }

  private setAssigning(kitchenOrderId: number, isAssigning: boolean): void {
    this.assigningKitchenOrderIds.update((ids) => {
      const exists = ids.includes(kitchenOrderId);

      if (isAssigning) {
        return exists ? ids : [...ids, kitchenOrderId];
      }

      return exists ? ids.filter((id) => id !== kitchenOrderId) : ids;
    });
  }

  private markOrderAsAssigned(orderId: number, waiterId: number, waiterName?: string): void {
    this.orders.update((orders) =>
      orders.map((order) => {
        if (order.id !== orderId) {
          return order;
        }

        return {
          ...order,
          waiterId,
          waiterName: waiterName?.trim().length ? waiterName : order.waiterName,
        };
      })
    );
  }
}
