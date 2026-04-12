import {
  ChangeDetectionStrategy,
  Component,
  OnInit,
  OnDestroy,
  computed,
  inject,
  signal,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { KitchenService, Order, Waiter } from '../../services/kitchen.service';
import { Subject, catchError, of, takeUntil, tap } from 'rxjs';
import { KitchenRealtimeService } from '../../services/kitchen-realtime.service';

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
  standalone: true,
  imports: [CommonModule],
  templateUrl: './kitchen.html',
  styleUrl: './kitchen.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Kitchen implements OnInit, OnDestroy {
  private readonly kitchenService = inject(KitchenService);
  private readonly kitchenRealtimeService = inject(KitchenRealtimeService);
  private readonly alertDismissTimeoutMs = 3000;
  private alertDismissTimer: ReturnType<typeof setTimeout> | null = null;
  private readonly destroy$ = new Subject<void>();

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
      const assignedReadyOrders = Math.max(
        Number(waiter.activeOrdersCount ?? 0),
        assignmentsByWaiter[waiter.id] ?? 0,
      );

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
    this.connectRealtimeUpdates();
  }

  refreshBoard(): void {
    this.isLoading.set(true);
    this.clearAlerts();

    this.loadBoard().subscribe();
  }

  private loadBoard() {
    return this.kitchenService.getDashboardOrders().pipe(
      tap((orders) => {
        this.orders.set(orders);
        this.isLoading.set(false);
      }),
      catchError(() => {
        this.showErrorMessage('Failed to load kitchen orders. Please try again.');
        this.isLoading.set(false);
        return of([] as Order[]);
      })
    );
  }

  private loadWaiters(): void {
    this.isWaitersLoading.set(true);
    this.kitchenService.getWaiters().subscribe({
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
    const selectedOrder = this.readyCards().find((card) => card.id === cardId) ?? null;
    if (!selectedOrder) {
      this.showErrorMessage('Selected order not found in ready list.');
      return;
    }

    if (selectedOrder.waiterId) {
      this.showErrorMessage('This order already has a waiter assigned.');
      return;
    }

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
      this.showErrorMessage('Selected order could not be found. Please refresh the board.');
      return;
    }

    if (selectedOrder.waiterId) {
      this.showErrorMessage('This order already has a waiter assigned.');
      this.closeWaiterAssignmentModal();
      return;
    }

    this.assignWaiterToOrder(selectedOrder, waiterId);
  }

  private assignWaiterToOrder(selectedOrder: Order, waiterId: number): void {
    this.activeOrderActionId.set(selectedOrder.id);

    const assignToKitchenOrder = (kitchenOrderId: number): void => {
      this.kitchenService.assignWaiter(kitchenOrderId, waiterId).subscribe({
      next: () => {
        const waiter = this.waiters().find((item) => item.id === waiterId);
        this.orders.update((orders) =>
          orders.map((order) =>
            order.id === selectedOrder.id
              ? {
                  ...order,
                  kitchenOrderId,
                  waiterId,
                  waiterName: waiter?.name ?? order.waiterName,
                }
              : order
          )
        );
        this.successMessage.set('Waiter assigned successfully.');
        this.scheduleAlertDismissal();
        this.activeOrderActionId.set(null);
        this.closeWaiterAssignmentModal();
      },
      error: () => {
        this.showErrorMessage('Failed to assign waiter. Please try again.');
        this.activeOrderActionId.set(null);
      },
    });
    };

    if (selectedOrder.kitchenOrderId && selectedOrder.kitchenOrderId > 0) {
      assignToKitchenOrder(selectedOrder.kitchenOrderId);
      return;
    }

    this.kitchenService.resolveKitchenOrderId(selectedOrder.id).subscribe({
      next: (resolvedKitchenOrderId) => {
        if (!resolvedKitchenOrderId) {
          this.showErrorMessage('Kitchen order reference not found. This order may already be closed in backend.');
          this.activeOrderActionId.set(null);
          return;
        }

        assignToKitchenOrder(resolvedKitchenOrderId);
      },
      error: () => {
        this.showErrorMessage('Failed to locate kitchen order reference. Please refresh and try again.');
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
    this.clearAlerts();
    this.activeOrderActionId.set(order.id);

    const executeStatusUpdate = (): void => {
      this.kitchenService.updateOrderStatus(order.id, status).subscribe({
        next: () => {
          this.showSuccessMessage('Order status updated.');
          this.activeOrderActionId.set(null);
          this.refreshBoard();
        },
        error: () => {
          this.showErrorMessage('Failed to update order status.');
          this.activeOrderActionId.set(null);
        },
      });
    };

    if (!order.isSentToKitchen && status !== 'RECEIVED') {
      this.kitchenService.sendToKitchen(order.id).subscribe({
        next: () => executeStatusUpdate(),
        error: () => {
          this.showErrorMessage('Failed to send order to kitchen.');
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

    if (status === 'PREPARING' || status === 'IN_PROGRESS') {
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
      .map((item) => `${item.quantity}x ${item.menuItemName ?? `Item #${item.menuItemId}`}`)
      .join(', ');
  }

  trackOrder(index: number, order: Order): string {
    return `${order.id}-${index}`;
  }

  isBusy(order: Order): boolean {
    return this.activeOrderActionId() === order.id;
  }

  ngOnDestroy(): void {
    this.clearAlertDismissTimer();
    this.destroy$.next();
    this.destroy$.complete();
    this.kitchenRealtimeService.disconnect();
  }

  private connectRealtimeUpdates(): void {
    this.kitchenRealtimeService.connect();

    this.kitchenRealtimeService.connection$
      .pipe(takeUntil(this.destroy$))
      .subscribe((isConnected) => {
        if (!isConnected) {
          return;
        }

        this.loadBoard().subscribe();
        this.loadWaiters();
      });

    this.kitchenRealtimeService.updates$
      .pipe(takeUntil(this.destroy$))
      .subscribe(() => {
        this.loadBoard().subscribe();
        this.loadWaiters();
      });
  }

  private showSuccessMessage(message: string): void {
    this.errorMessage.set('');
    this.successMessage.set(message);
    this.scheduleAlertDismissal();
  }

  private showErrorMessage(message: string): void {
    this.successMessage.set('');
    this.errorMessage.set(message);
    this.scheduleAlertDismissal();
  }

  private clearAlerts(): void {
    this.clearAlertDismissTimer();
    this.errorMessage.set('');
    this.successMessage.set('');
  }

  private scheduleAlertDismissal(): void {
    this.clearAlertDismissTimer();
    this.alertDismissTimer = setTimeout(() => {
      this.errorMessage.set('');
      this.successMessage.set('');
      this.alertDismissTimer = null;
    }, this.alertDismissTimeoutMs);
  }

  private clearAlertDismissTimer(): void {
    if (this.alertDismissTimer !== null) {
      clearTimeout(this.alertDismissTimer);
      this.alertDismissTimer = null;
    }
  }
}
