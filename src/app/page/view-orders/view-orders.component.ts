import { Component, computed, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { OrderService } from '../../services/order.service';
import { PortionDto } from '../../models/order-placement.model';
import { OrderItemWithName, OrderStatus, OrderStatusFilter, OrderWithItemNameResponse } from '../../models/order.model';

@Component({
  selector: 'app-view-orders',
  imports: [CommonModule, DatePipe],
  templateUrl: './view-orders.component.html',
  styleUrls: ['./view-orders.component.css']
})
export class ViewOrdersComponent implements OnInit {
  // State
  readonly orders = signal<OrderWithItemNameResponse[]>([]);
  readonly selectedOrder = signal<OrderWithItemNameResponse | null>(null);
  readonly selectedOrderId = signal<number | null>(null);
  readonly isLoadingOrders = signal<boolean>(false);
  readonly isLoadingDetails = signal<boolean>(false);
  readonly error = signal<string | null>(null);
  readonly activeFilter = signal<OrderStatus | 'all'>('all');
  readonly portionsById = signal<Map<number, string>>(new Map());

  // Status filters
  readonly statusFilters: OrderStatusFilter[] = [
    { label: 'All', value: 'all', color: 'gray' },
    { label: 'Open', value: 'open', color: 'amber' },
    { label: 'In Kitchen', value: 'sent_to_kitchen', color: 'blue' },
    { label: 'Partially Ready', value: 'partially_ready', color: 'cyan' },
    { label: 'Ready', value: 'ready', color: 'teal' },
    { label: 'Paid', value: 'paid', color: 'green' },
    { label: 'Voided', value: 'voided', color: 'red' }
  ];

  // Computed values
  readonly hasOrders = computed(() => this.orders().length > 0);
  readonly hasError = computed(() => this.error() !== null);

  constructor(private orderService: OrderService) { }

  ngOnInit(): void {
    this.loadPortions();
    this.loadOrders();
  }

  private loadPortions(): void {
    this.orderService.getAllPortions().subscribe({
      next: (portions: PortionDto[]) => {
        const nextMap = new Map<number, string>();
        for (const portion of portions) {
          if (Number.isFinite(portion.id) && portion.id > 0 && portion.name.trim().length > 0) {
            nextMap.set(portion.id, portion.name.trim());
          }
        }
        this.portionsById.set(nextMap);

        const current = this.selectedOrder();
        if (current) {
          this.selectedOrder.set(this.enrichOrderWithPortionNames(current));
        }
      },
      error: (err) => {
        // Non-blocking: orders can still render without portion master data.
        console.warn('Failed to load portions master list:', err);
      },
    });
  }

  loadOrders(): void {
    this.error.set(null);
    this.isLoadingOrders.set(true);
    this.selectedOrder.set(null);
    this.selectedOrderId.set(null);

    const filter = this.activeFilter();
    const request$ = filter === 'all'
      ? this.orderService.getAllOrdersWithItemNames()
      : this.orderService.getOrdersByStatus(filter);

    request$.subscribe({
      next: (orders) => {
        this.orders.set(orders);
        this.isLoadingOrders.set(false);
      },
      error: (err) => {
        console.error('Failed to load orders:', err);
        this.error.set('Failed to load orders. Please try again.');
        this.isLoadingOrders.set(false);
      }
    });
  }

  selectOrder(order: OrderWithItemNameResponse): void {
    this.selectedOrderId.set(order.id);
    this.isLoadingDetails.set(true);
    this.error.set(null);

    this.orderService.getOrderWithItemNamesById(order.id).subscribe({
      next: (fullOrder) => {
        this.selectedOrder.set(this.enrichOrderWithPortionNames(fullOrder));
        this.isLoadingDetails.set(false);
      },
      error: (err) => {
        console.error('Failed to load order details:', err);
        this.error.set('Failed to load order details. Please try again.');
        this.isLoadingDetails.set(false);
        // Fallback to the basic order data
        this.selectedOrder.set(this.enrichOrderWithPortionNames(order));
      }
    });
  }

  private enrichOrderWithPortionNames(order: OrderWithItemNameResponse): OrderWithItemNameResponse {
    const portionMap = this.portionsById();

    return {
      ...order,
      items: (order.items ?? []).map((item) => {
        const existingName = (item.portionName ?? '').trim();
        const fallbackName = portionMap.get(item.portionId);

        return {
          ...item,
          portionName:
            existingName.length > 0
              ? existingName
              : (fallbackName?.trim() ?? (Number.isFinite(item.portionId) && item.portionId > 0 ? `Portion ${item.portionId}` : 'Portion')),
        };
      }),
    };
  }

  filterByStatus(status: OrderStatus | 'all'): void {
    this.activeFilter.set(status);
    this.loadOrders();
  }

  onStatusFilterChange(value: string): void {
    const allowed = new Set<OrderStatus | 'all'>([
      'all',
      'open',
      'sent_to_kitchen',
      'partially_ready',
      'ready',
      'paid',
      'voided',
    ]);

    const nextValue = (allowed.has(value as any) ? (value as OrderStatus | 'all') : 'all');
    this.filterByStatus(nextValue);
  }

  private readonly statusPillClasses: Record<string, string> = {
    open: 'inline-flex items-center rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-800',
    sent_to_kitchen: 'inline-flex items-center rounded-full bg-blue-100 px-2.5 py-1 text-xs font-semibold text-blue-800',
    partially_ready: 'inline-flex items-center rounded-full bg-cyan-100 px-2.5 py-1 text-xs font-semibold text-cyan-800',
    ready: 'inline-flex items-center rounded-full bg-teal-100 px-2.5 py-1 text-xs font-semibold text-teal-800',
    paid: 'inline-flex items-center rounded-full bg-green-100 px-2.5 py-1 text-xs font-semibold text-green-800',
    voided: 'inline-flex items-center rounded-full bg-red-100 px-2.5 py-1 text-xs font-semibold text-red-800',
  };

  getOrderStatusPillClass(status: string): string {
    return this.statusPillClasses[status] ??
      'inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700';
  }

  getOrderTypePillClass(): string {
    return 'inline-flex items-center rounded-full bg-gray-100 px-2.5 py-1 text-xs font-semibold text-gray-700';
  }

  getStatusLabel(status: string): string {
    return status
      .replace(/_/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
      .join(' ');
  }

  getPortionName(item: OrderItemWithName): string {
    const existing = (item.portionName ?? '').trim();
    if (existing.length > 0) {
      return existing;
    }

    return this.portionsById().get(item.portionId) ??
      (Number.isFinite(item.portionId) && item.portionId > 0 ? `Portion ${item.portionId}` : 'Portion');
  }

  getRelativeTime(dateString: string): string {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} min${diffMins > 1 ? 's' : ''} ago`;
    if (diffHours < 24) return `${diffHours} hour${diffHours > 1 ? 's' : ''} ago`;
    if (diffDays < 7) return `${diffDays} day${diffDays > 1 ? 's' : ''} ago`;

    return date.toLocaleDateString();
  }

  retry(): void {
    this.loadOrders();
  }
}
