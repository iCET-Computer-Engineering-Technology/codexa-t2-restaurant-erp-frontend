import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  computed,
  inject,
  signal,
} from '@angular/core';
import { KitchenService, Order, Waiter } from '../../services/kitchen.service';
import { catchError, of, tap } from 'rxjs';

type BoardColumn = 'new' | 'preparing' | 'ready';

interface WaiterAssignmentOption {
  id: number;
  label: string;
  isActive: boolean;
  assignedReadyOrders: number;
  workloadPercent: number;
  workloadLabel: string;
}

@Component({
  selector: 'app-kitchen',
  imports: [],
  templateUrl: './kitchen.html',
  styleUrl: './kitchen.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Kitchen implements OnInit {
  private readonly kitchenService = inject(KitchenService);

  readonly orders = signal<Order[]>([]);
  readonly waiters = signal<Waiter[]>([]);
  readonly isLoading = signal(false);
  readonly isWaitersLoading = signal(false);
  readonly errorMessage = signal('');
  readonly successMessage = signal('');
  readonly activeOrderActionId = signal<number | null>(null);

  readonly newCards = computed(() => this.orders().filter((order) => this.getBoardColumn(order) === 'new'));
  readonly preparingCards = computed(() => this.orders().filter((order) => this.getBoardColumn(order) === 'preparing'));
  readonly readyCards = computed(() => this.orders().filter((order) => this.getBoardColumn(order) === 'ready'));

  readonly totalOrdersCount = computed(
    () => this.newCards().length + this.preparingCards().length + this.readyCards().length
  );
  readonly selectedWaiterModalCardId = signal<number | null>(null);
  readonly isWaiterModalOpen = computed(() => this.selectedWaiterModalCardId() !== null);
  readonly selectedWaiterModalCard = computed(() => {
    const selectedCardId = this.selectedWaiterModalCardId();
    if (!selectedCardId) {
      return null;
    }

    return this.readyCards().find((card) => card.id === selectedCardId) ?? null;
  });

  readonly waiterAssignmentOptions = computed<WaiterAssignmentOption[]>(() => {
    const assignmentsByWaiter = this.readyCards().reduce<Record<number, number>>((accumulator, card) => {
      if (!card.waiterId) {
        return accumulator;
      }

      accumulator[card.waiterId] = (accumulator[card.waiterId] ?? 0) + 1;
      return accumulator;
    }, {});

    return this.waiters().map((waiter) => {
      const assignedReadyOrders = assignmentsByWaiter[waiter.id] ?? 0;
      return {
        id: waiter.id,
        label: `${waiter.name} (#${waiter.id})`,
        isActive: waiter.status.toUpperCase() !== 'INACTIVE',
        assignedReadyOrders,
        workloadPercent: Math.min(100, assignedReadyOrders * 25),
        workloadLabel: this.getWorkloadLabel(assignedReadyOrders),
      };
    });
  });

  readonly activeDropColumn = signal<BoardColumn | null>(null);

  private readonly draggingState = signal<{ card: Order; from: BoardColumn } | null>(null);

  ngOnInit(): void {
    this.refreshBoard();
    this.loadWaiters();
  }

  refreshBoard(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');

    this.loadBoard().subscribe();
  }

  private loadBoard() {
    return this.kitchenService.getDashboardOrders().pipe(
      tap((orders) => {
        this.orders.set(orders);
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.errorMessage.set('Failed to load kitchen orders. Please try again.');
        this.isLoading.set(false);
        return of([] as Order[]);
      })
    );
  }

  private loadWaiters(): void {
    this.isWaitersLoading.set(true);
    this.kitchenService.getAvailableWaiters().subscribe({
      next: (waiters) => {
        this.waiters.set(waiters);
        this.isWaitersLoading.set(false);
      },
      error: () => {
        this.isWaitersLoading.set(false);
      },
    });
  }

  onDragStart(event: DragEvent, cardId: number, from: BoardColumn): void {
    const card = this.findCard(cardId, from);
    if (!card) {
      return;
    }

    this.draggingState.set({ card, from });
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('text/plain', String(card.id));
    }
  }

  onDragOver(event: DragEvent, to: BoardColumn): void {
    event.preventDefault();
    const dragging = this.draggingState();
    if (!dragging) {
      return;
    }

    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }

    if (dragging.from !== to) {
      this.activeDropColumn.set(to);
    }
  }

  onDragLeave(column: BoardColumn): void {
    if (this.activeDropColumn() === column) {
      this.activeDropColumn.set(null);
    }
  }

  onDrop(event: DragEvent, to: BoardColumn): void {
    event.preventDefault();
    this.activeDropColumn.set(null);

    const dragging = this.draggingState();
    if (!dragging) {
      return;
    }

    this.moveInternal(dragging.card.id, dragging.from, to);
    this.draggingState.set(null);
  }

  onDragEnd(): void {
    this.activeDropColumn.set(null);
    this.draggingState.set(null);
  }

  moveCard(cardId: number, from: BoardColumn, to: BoardColumn): void {
    this.moveInternal(cardId, from, to);
  }

  openWaiterAssignmentModal(cardId: number): void {
    this.selectedWaiterModalCardId.set(cardId);
    this.successMessage.set('');
    this.errorMessage.set('');
  }

  closeWaiterAssignmentModal(): void {
    this.selectedWaiterModalCardId.set(null);
  }

  assignWaiterFromModal(waiterId: number): void {
    const selectedCardId = this.selectedWaiterModalCardId();
    if (!selectedCardId) {
      return;
    }

    const selectedOrder = this.readyCards().find((order) => order.id === selectedCardId) ?? null;
    if (!selectedOrder) {
      this.errorMessage.set('Selected order could not be found. Please refresh the board.');
      return;
    }

    if (!selectedOrder.kitchenOrderId) {
      this.errorMessage.set('Refreshing kitchen data before assigning waiter...');
      this.isLoading.set(true);
      this.loadBoard().subscribe({
        next: () => {
          const refreshedOrder = this.readyCards().find((order) => order.id === selectedCardId) ?? null;
          if (!refreshedOrder) {
            this.errorMessage.set('Order data is unavailable right now. Please refresh and try again.');
            return;
          }

          this.assignWaiterToOrder(refreshedOrder, waiterId);
        },
      });
      return;
    }

    this.assignWaiterToOrder(selectedOrder, waiterId);
  }

  private assignWaiterToOrder(selectedOrder: Order, waiterId: number): void {
    this.activeOrderActionId.set(selectedOrder.id);
    this.kitchenService
      .assignWaiterWithFallback(selectedOrder.kitchenOrderId ?? selectedOrder.id, waiterId, selectedOrder.id)
      .subscribe({
      next: () => {
        const waiter = this.waiters().find((item) => item.id === waiterId);
        this.orders.update((orders) =>
          orders.map((order) =>
            order.id === selectedOrder.id
              ? {
                  ...order,
                  waiterId,
                  waiterName: waiter?.name ?? order.waiterName,
                }
              : order
          )
        );
        this.successMessage.set('Waiter assigned successfully.');
        this.activeOrderActionId.set(null);
        this.closeWaiterAssignmentModal();
      },
      error: () => {
        this.errorMessage.set('Failed to assign waiter. Please try again.');
        this.activeOrderActionId.set(null);
      },
    });
  }

  startPreparing(order: Order): void {
    this.changeOrderStatus(order, 'PREPARING');
  }

  markAsReady(order: Order): void {
    this.changeOrderStatus(order, 'READY');
  }

  markAsReceived(order: Order): void {
    this.changeOrderStatus(order, 'RECEIVED');
  }

  private changeOrderStatus(order: Order, status: string): void {
    this.errorMessage.set('');
    this.successMessage.set('');
    this.activeOrderActionId.set(order.id);

    const executeStatusUpdate = (targetOrder: Order = order): void => {
      this.kitchenService.updateOrderStatus(targetOrder, status).subscribe({
        next: () => {
          this.successMessage.set('Order status updated.');
          this.activeOrderActionId.set(null);
          this.refreshBoard();
        },
        error: () => {
          if (status === 'PREPARING') {
            this.activeOrderActionId.set(null);
            this.refreshBoard();
            return;
          }

          this.errorMessage.set('Failed to update order status.');
          this.activeOrderActionId.set(null);
        },
      });
    };

    const triggerPreparingAfterSend = (): void => {
      this.isLoading.set(true);
      this.loadBoard().subscribe({
        next: (orders) => {
          const refreshedOrder =
            orders.find((candidate) => candidate.id === order.id) ??
            this.orders().find((candidate) => candidate.id === order.id) ??
            order;
          executeStatusUpdate(refreshedOrder);
        },
      });
    };

    if (!order.isSentToKitchen && status !== 'RECEIVED') {
      this.kitchenService.sendToKitchen(order.id).subscribe({
        next: () => {
          if (status === 'PREPARING') {
            triggerPreparingAfterSend();
            return;
          }

          executeStatusUpdate();
        },
        error: (error) => {
          const statusCode = Number(error?.status ?? 0);
          if (statusCode === 400 || statusCode === 409) {
            if (status === 'PREPARING') {
              triggerPreparingAfterSend();
              return;
            }

            executeStatusUpdate();
            return;
          }

          this.errorMessage.set('Failed to send order to kitchen.');
          this.activeOrderActionId.set(null);
        },
      });
      return;
    }

    executeStatusUpdate();
  }

  private moveInternal(cardId: number, from: BoardColumn, to: BoardColumn): void {
    if (from === to) {
      return;
    }

    const card = this.findCard(cardId, from);
    if (!card) {
      return;
    }

    if (to === 'new') {
      this.markAsReceived(card);
      return;
    }

    if (to === 'preparing') {
      this.startPreparing(card);
      return;
    }

    this.markAsReady(card);
  }

  private findCard(cardId: number, from: BoardColumn): Order | undefined {
    return this.getColumn(from).find((card) => card.id === cardId);
  }

  private getWorkloadLabel(workload: number): string {
    if (workload <= 1) {
      return 'Light load';
    }

    if (workload <= 3) {
      return 'Medium load';
    }

    return 'Heavy load';
  }

  private getColumn(column: BoardColumn): Order[] {
    switch (column) {
      case 'new':
        return this.newCards();
      case 'preparing':
        return this.preparingCards();
      case 'ready':
        return this.readyCards();
      default:
        return this.newCards();
    }
  }

  getBoardColumn(order: Order): BoardColumn {
    const status = (order.status || '').toUpperCase();

    if (status === 'READY' || status === 'PARTIALLY_READY' || status === 'PARTICALLY_READY') {
      return 'ready';
    }

    if (
      status === 'PREPARING' ||
      status === 'IN_PROGRESS' ||
      status === 'SENT' ||
      status === 'SENT_TO_KITCHEN' ||
      status === 'QUEUED' ||
      status === 'KITCHEN_QUEUE'
    ) {
      return 'preparing';
    }

    return 'new';
  }

  getTableLabel(order: Order): string {
    if (!order.tableId) {
      return 'Takeaway';
    }

    return `Table ${order.tableId}`;
  }

  getSummary(order: Order): string {
    if (!order.items.length) {
      return 'No order items';
    }

    return order.items
      .map((item) => {
        const itemLabel = item.menuItemName ?? `Item #${item.menuItemId}`;
        return `${item.quantity}x ${itemLabel}`;
      })
      .join(', ');
  }

  trackOrder(index: number, order: Order): string {
    return `${order.id}-${index}`;
  }

  isBusy(order: Order): boolean {
    return this.activeOrderActionId() === order.id;
  }

}
