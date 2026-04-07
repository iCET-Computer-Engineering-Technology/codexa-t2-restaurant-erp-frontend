import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, switchMap, throwError } from 'rxjs';

import { environment } from '../../environments/environment';

export interface OrderItem {
  id: number;
  orderId: number;
  menuItemId: number;
  menuItemName?: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface Order {
  id: number;
  kitchenOrderId?: number;
  isSentToKitchen?: boolean;
  tableId: number;
  orderNumber: string;
  status: string;
  waiterId?: number;
  waiterName?: string;
  items: OrderItem[];
}

export interface Waiter {
  id: number;
  name: string;
  status: string;
}

export interface Chef {
  id: number;
  name: string;
  status: string;
}

@Injectable({ providedIn: 'root' })
export class KitchenService {
  private readonly http = inject(HttpClient);
  private readonly api = environment.apiUrl;
  private readonly readyOrdersCacheKey = 'kitchen-ready-orders';

  getOrders(): Observable<Order[]> {
    return this.loadOrders(false);
  }

  getDashboardOrders(): Observable<Order[]> {
    return this.loadOrders(true);
  }

  sendToKitchen(orderId: number): Observable<void> {
    return this.tryKitchenOrderCommand('send', orderId);
  }

  markOrderReady(orderId: number): Observable<void> {
    return this.tryKitchenOrderCommand('ready', orderId);
  }

  recordReadyOrder(order: Order): void {
    const normalized: Order = {
      ...order,
      isSentToKitchen: true,
      status: 'READY',
    };

    const existing = this.getCachedReadyOrders();
    const merged = this.mergeMissingOrders(
      existing.filter((item) => item.id !== normalized.id),
      [normalized]
    );

    this.saveCachedReadyOrders(merged);
  }

  private loadOrders(includePendingOpenOrders: boolean): Observable<Order[]> {
    return forkJoin({
      kitchenOrders: this.http
        .get<unknown>(`${this.api}/kitchen/orders`)
        .pipe(map((response) => this.normalizeKitchenOrders(response)), catchError(() => of([]))),
      openOrders: this.http
        .get<unknown>(`${this.api}/kitchen/open-orders`)
        .pipe(map((response) => this.normalizeOpenOrders(response)), catchError(() => of([]))),
      assignments: this.http
        .get<unknown>(`${this.api}/kitchen/assignments`)
        .pipe(map((response) => this.normalizeAssignments(response)), catchError(() => of([]))),
      menuItems: this.http
        .get<unknown>(`${this.api}/menu-items`)
        .pipe(map((response) => this.normalizeMenuItemLookup(response)), catchError(() => of(new Map<number, string>()))),
    }).pipe(
      switchMap(({ kitchenOrders, openOrders, assignments, menuItems }) => {
        const detailByOrderId = new Map(openOrders.map((order) => [order.id, order]));
        const assignmentByKitchenOrderId = new Map(assignments.map((item) => [item.kitchenOrderId, item]));
        const serverReadyHistory = openOrders.filter((order) => this.isReadyLikeStatus(order.status));
        const knownOrderIds = new Set<number>([
          ...openOrders.map((order) => order.id),
          ...kitchenOrders.map((kitchenOrder) => kitchenOrder.orderId),
        ]);
        const allCachedReadyHistory = this.getCachedReadyOrders();
        const cachedReadyHistory =
          knownOrderIds.size > 0
            ? allCachedReadyHistory.filter((order) => knownOrderIds.has(order.id))
            : allCachedReadyHistory;

        // Keep local cache aligned to server-visible orders so deleted DB rows are not shown again.
        if (knownOrderIds.size > 0) {
          this.saveCachedReadyOrders(cachedReadyHistory);
        }

        const readyHistory = this.mergeMissingOrders(serverReadyHistory, cachedReadyHistory).map((order) => ({
            ...order,
            isSentToKitchen: true,
            status: this.normalizeStatus(order.status),
          }));

        if (kitchenOrders.length === 0) {
          if (!includePendingOpenOrders) {
            return of(this.applyMenuItemNames(this.mergeMissingOrders([], readyHistory), menuItems).sort((a, b) => b.id - a.id));
          }

          const withPending = this.mergeMissingOrders(
            openOrders.map((order) => ({
              ...order,
              isSentToKitchen: order.isSentToKitchen ?? false,
            })),
            readyHistory
          );

          return of(this.applyMenuItemNames(withPending, menuItems).sort((a, b) => b.id - a.id));
        }

        const detailRequests = kitchenOrders.map((kitchenOrder) => {
          return this.http
            .get<unknown>(`${this.api}/order/find-by-id/${kitchenOrder.orderId}`)
            .pipe(
              map((response) => this.normalizeOrderDetail(response)),
              catchError(() => of(detailByOrderId.get(kitchenOrder.orderId) ?? null))
            );
        });

        return forkJoin(detailRequests).pipe(
          map((details) => {
            const merged = kitchenOrders.map((kitchenOrder, index) => {
              const detail = details[index] ?? detailByOrderId.get(kitchenOrder.orderId);
              const assignment = assignmentByKitchenOrderId.get(kitchenOrder.id);

              return {
                id: kitchenOrder.orderId,
                kitchenOrderId: kitchenOrder.id,
                isSentToKitchen: true,
                tableId: detail?.tableId ?? 0,
                orderNumber: detail?.orderNumber ?? `ORD-${kitchenOrder.orderId}`,
                status: this.normalizeStatus(kitchenOrder.status || detail?.status),
                waiterId: assignment?.waiterId,
                waiterName: assignment?.waiterName,
                items: detail?.items ?? [],
              } satisfies Order;
            });

            if (!includePendingOpenOrders) {
              const withReadyHistory = this.mergeMissingOrders(merged, readyHistory);
              return this.applyMenuItemNames(withReadyHistory, menuItems).sort((a, b) => b.id - a.id);
            }

            // Keep any open orders that do not yet have a kitchen-order row.
            const kitchenOrderIds = new Set(merged.map((item) => item.id));
            const pending = openOrders
              .filter((order) => !kitchenOrderIds.has(order.id))
              .map((order) => ({
                ...order,
                isSentToKitchen: order.isSentToKitchen ?? false,
                status: this.normalizeStatus(order.status),
              }));

            const withReadyHistory = this.mergeMissingOrders([...merged, ...pending], readyHistory);
            return this.applyMenuItemNames(withReadyHistory, menuItems).sort((a, b) => b.id - a.id);
          })
        );
      })
    );
  }

  getWaiters(): Observable<Waiter[]> {
    return this.http
      .get<unknown>(`${this.api}/kitchen/waiters`)
      .pipe(map((response) => this.normalizeWaiters(response)), catchError(() => of([])));
  }

  getAvailableWaiters(): Observable<Waiter[]> {
    return this.getWaiters().pipe(
      map((waiters) => {
        const availableWaiters = waiters.filter((waiter) => this.isWaiterAvailable(waiter.status));
        return availableWaiters.length > 0 ? availableWaiters : waiters;
      })
    );
  }

  getChefs(): Observable<Chef[]> {
    return this.http
      .get<unknown>(`${this.api}/kitchen/chefs`)
      .pipe(map((response) => this.normalizeChefs(response)), catchError(() => of([])));
  }

  assignWaiter(kitchenOrderId: number, waiterId: number): Observable<void> {
    return this.assignWaiterWithFallback(kitchenOrderId, waiterId);
  }

  assignChef(kitchenOrderId: number, chefId: number): Observable<void> {
    return this.assignChefWithFallback(kitchenOrderId, chefId);
  }

  assignWaiterWithFallback(kitchenOrderId: number, waiterId: number, orderId?: number): Observable<void> {
    const payloads: Array<Record<string, unknown>> = [{ kitchenOrderId, waiterId }];

    if (orderId != null && Number.isFinite(orderId) && orderId > 0) {
      payloads.push({ orderId, waiterId });

      if (orderId !== kitchenOrderId) {
        payloads.push({ kitchenOrderId: orderId, waiterId });
      }
    }

    return this.tryPostPayloads(`${this.api}/kitchen/assign`, payloads);
  }

  assignChefWithFallback(kitchenOrderId: number, chefId: number, orderId?: number): Observable<void> {
    const payloads: Array<Record<string, unknown>> = [{ kitchenOrderId, chefId }];

    if (orderId != null && Number.isFinite(orderId) && orderId > 0) {
      payloads.push({ orderId, chefId });

      if (orderId !== kitchenOrderId) {
        payloads.push({ kitchenOrderId: orderId, chefId });
      }
    }

    return this.tryPostPayloads(`${this.api}/kitchen/assign-chef`, payloads);
  }

  updateOrderItemStatus(orderItemId: number, status: string): Observable<void> {
    const endpoint = `${this.api}/kitchen/order-items/${orderItemId}/status`;
    const statusCandidates = this.getStatusCandidates(this.normalizeStatus(status));

    return this.tryPatchOrderItemStatus(endpoint, statusCandidates);
  }

  private tryPatchOrderItemStatus(endpoint: string, statuses: string[]): Observable<void> {
    const [current, ...remaining] = statuses;

    if (!current) {
      return throwError(() => new Error('No valid order-item status available'));
    }

    const params = new HttpParams().set('status', current);

    return this.http.patch<void>(endpoint, null, { params }).pipe(
      map(() => undefined),
      catchError((error) => {
        const statusCode = Number(error?.status ?? 0);
        if (statusCode === 404 || remaining.length === 0) {
          return throwError(() => error);
        }

        return this.tryPatchOrderItemStatus(endpoint, remaining);
      })
    );
  }

  updateOrderStatus(order: Order, status: string): Observable<void> {
    const normalized = this.normalizeStatus(status);

    if (normalized === 'READY') {
      return this.markOrderReady(order.id);
    }

    return this.patchOrderItemsStatus(order, normalized);
  }

  private patchOrderItemsStatus(order: Order, status: string): Observable<void> {
    const orderItemIds = Array.from(
      new Set(order.items.map((item) => item.id).filter((id) => Number.isFinite(id) && id > 0))
    );
    const patchTargets = orderItemIds.length > 0 ? orderItemIds : [order.id];

    return this.patchOrderItemsSequentially(patchTargets, status).pipe(
      map(() => undefined),
      catchError((error) => {
        const statusCode = Number(error?.status ?? 0);
        const canRetryWithOrderId = !patchTargets.includes(order.id) && order.id > 0;

        if (!canRetryWithOrderId || statusCode === 404) {
          return throwError(() => error);
        }

        return this.updateOrderItemStatus(order.id, status).pipe(catchError(() => throwError(() => error)));
      })
    );
  }

  private patchOrderItemsSequentially(targets: number[], status: string, index = 0): Observable<void> {
    if (index >= targets.length) {
      return of(undefined);
    }

    return this.updateOrderItemStatus(targets[index], status).pipe(
      switchMap(() => this.patchOrderItemsSequentially(targets, status, index + 1))
    );
  }

  private getStatusCandidates(status: string): string[] {
    const normalized = status.trim().toUpperCase();

    if (normalized === 'PREPARING') {
      return ['PREPARING'];
    }

    if (normalized === 'RECEIVED') {
      return ['RECEIVED', 'NEW'];
    }

    return [normalized];
  }

  private tryKitchenOrderCommand(command: 'send' | 'ready', orderId: number): Observable<void> {
    const endpoint = `${this.api}/kitchen/${command}`;
    const orderIdParams = new HttpParams().set('orderId', orderId);
    const idParams = new HttpParams().set('id', orderId);

    return this.tryKitchenCommandVariants([
      () => this.http.post<void>(endpoint, null, { params: orderIdParams }).pipe(map(() => undefined)),
      () => this.http.post<void>(endpoint, { orderId }, { params: orderIdParams }).pipe(map(() => undefined)),
      () => this.http.post<void>(endpoint, null, { params: idParams }).pipe(map(() => undefined)),
    ]);
  }

  private tryKitchenCommandVariants(requestFactories: Array<() => Observable<void>>): Observable<void> {
    const [current, ...remaining] = requestFactories;

    if (!current) {
      return throwError(() => new Error('No kitchen command variants available'));
    }

    return current().pipe(
      catchError((error) => {
        const statusCode = Number(error?.status ?? 0);
        if (statusCode === 400 || statusCode === 404 || remaining.length === 0) {
          return throwError(() => error);
        }

        return this.tryKitchenCommandVariants(remaining);
      })
    );
  }

  private tryPostPayloads(endpoint: string, payloads: Array<Record<string, unknown>>): Observable<void> {
    return this.tryRequestFactories(
      payloads.map((payload) => () => this.http.post<void>(endpoint, payload).pipe(map(() => undefined)))
    );
  }

  private tryRequestFactories(requestFactories: Array<() => Observable<void>>): Observable<void> {
    const [current, ...remaining] = requestFactories;

    if (!current) {
      return throwError(() => new Error('No request variants available'));
    }

    return current().pipe(
      catchError((error) => {
        if (remaining.length === 0) {
          return throwError(() => error);
        }

        return this.tryRequestFactories(remaining);
      })
    );
  }

  private normalizeKitchenOrders(response: unknown): Array<{ id: number; orderId: number; status: string }> {
    return this.extractArray<Record<string, unknown>>(response)
      .map((raw) => ({
        id: Number(raw['id']),
        orderId: Number(raw['orderId']),
        status: String(raw['status'] ?? ''),
      }))
      .filter((order) => Number.isFinite(order.id) && order.id > 0 && Number.isFinite(order.orderId));
  }

  private normalizeOpenOrders(response: unknown): Order[] {
    return this.extractArray<Record<string, unknown>>(response)
      .map((raw) => {
        const id = Number(raw['id']);
        const orderIdCandidate = Number(raw['orderId'] ?? raw['order_id']);
        const kitchenOrderIdCandidate = Number(raw['kitchenOrderId'] ?? raw['kitchen_order_id']);
        const resolvedOrderId = Number.isFinite(orderIdCandidate) && orderIdCandidate > 0 ? orderIdCandidate : id;
        let resolvedKitchenOrderId: number | undefined;

        if (Number.isFinite(kitchenOrderIdCandidate) && kitchenOrderIdCandidate > 0) {
          resolvedKitchenOrderId = kitchenOrderIdCandidate;
        } else if (Number.isFinite(orderIdCandidate) && orderIdCandidate > 0 && Number.isFinite(id) && id > 0 && id !== orderIdCandidate) {
          resolvedKitchenOrderId = id;
        }
        const tableId = Number(raw['tableId'] ?? 0);
        const orderNumber = String(raw['orderNumber'] ?? `ORD-${resolvedOrderId}`);
        const status = this.normalizeStatus(raw['status']);
        const items = this.normalizeOrderItems(
          raw['items'] ?? raw['orderItems'] ?? raw['orderItemDtos'] ?? raw['orderDetails'],
          resolvedOrderId
        );

        return {
          id: resolvedOrderId,
          kitchenOrderId: resolvedKitchenOrderId,
          isSentToKitchen: resolvedKitchenOrderId != null || this.isKitchenManagedStatus(status),
          tableId: Number.isFinite(tableId) ? tableId : 0,
          orderNumber,
          status,
          items,
        } satisfies Order;
      })
      .filter((order) => Number.isFinite(order.id) && order.id > 0);
  }

  private isKitchenManagedStatus(status: string): boolean {
    const normalized = status.trim().toUpperCase();
    return normalized === 'PREPARING' || normalized === 'IN_PROGRESS' || normalized === 'IN-PROGRESS' || this.isReadyLikeStatus(normalized);
  }

  private normalizeOrderDetail(response: unknown): Order | null {
    const raw = this.extractObject<Record<string, unknown>>(response);
    if (!raw) {
      return null;
    }

    const id = Number(raw['id']);
    if (!Number.isFinite(id) || id <= 0) {
      return null;
    }

    return {
      id,
      tableId: Number(raw['tableId'] ?? 0),
      orderNumber: String(raw['orderNumber'] ?? `ORD-${id}`),
      status: this.normalizeStatus(raw['status']),
      items: this.normalizeOrderItems(
        raw['items'] ?? raw['orderItems'] ?? raw['orderItemDtos'] ?? raw['orderDetails'],
        id
      ),
    } satisfies Order;
  }

  private normalizeOrderItems(items: unknown, fallbackOrderId: number): OrderItem[] {
    return this.extractArray<Record<string, unknown>>(items)
      .map((item) => {
        const quantity = Number(item['quantity'] ?? item['qty'] ?? item['count'] ?? 0);
        const unitPrice = Number(item['price'] ?? item['unitPrice'] ?? item['sellingPrice'] ?? 0);
        const orderId = Number(item['orderId'] ?? fallbackOrderId);
        const itemId = Number(
          item['orderItemId'] ??
            item['order_item_id'] ??
            item['orderLineId'] ??
            item['order_line_id'] ??
            item['lineId'] ??
            item['line_id'] ??
            item['id'] ??
            0
        );
        const menuItemId = Number(item['menuItemId'] ?? item['itemId'] ?? item['menu_item_id'] ?? 0);
        const menuItemName =
          item['menuItemName'] ?? item['itemName'] ?? item['name'] ?? (item['menuItem'] as Record<string, unknown>)?.['name'];
        const totalPrice = Number(item['lineTotal'] ?? item['totalPrice'] ?? item['subTotal'] ?? unitPrice * quantity);

        return {
          id: Number.isFinite(itemId) ? itemId : 0,
          orderId: Number.isFinite(orderId) ? orderId : fallbackOrderId,
          menuItemId: Number.isFinite(menuItemId) ? menuItemId : 0,
          menuItemName: menuItemName != null ? String(menuItemName) : undefined,
          quantity: Number.isFinite(quantity) ? quantity : 0,
          unitPrice: Number.isFinite(unitPrice) ? unitPrice : 0,
          totalPrice: Number.isFinite(totalPrice) ? totalPrice : unitPrice * quantity,
        } satisfies OrderItem;
      })
      .filter((item) => item.quantity > 0 && (item.menuItemId > 0 || !!item.menuItemName));
  }

  private normalizeMenuItemLookup(response: unknown): Map<number, string> {
    const lookup = new Map<number, string>();

    this.extractArray<Record<string, unknown>>(response).forEach((raw) => {
      const id = Number(raw['id'] ?? raw['itemId'] ?? raw['menuItemId'] ?? raw['menu_item_id']);
      const name = String(raw['name'] ?? raw['itemName'] ?? raw['menuItemName'] ?? '').trim();

      if (Number.isFinite(id) && id > 0 && name.length > 0) {
        lookup.set(id, name);
      }
    });

    return lookup;
  }

  private applyMenuItemNames(orders: Order[], nameLookup: Map<number, string>): Order[] {
    return orders.map((order) => ({
      ...order,
      items: order.items.map((item) => {
        if (item.menuItemName && item.menuItemName.trim().length > 0) {
          return item;
        }

        const fallbackName = nameLookup.get(item.menuItemId);
        if (!fallbackName) {
          return item;
        }

        return {
          ...item,
          menuItemName: fallbackName,
        };
      }),
    }));
  }

  private mergeMissingOrders(base: Order[], extra: Order[]): Order[] {
    const orderIds = new Set(base.map((order) => order.id));
    const missing = extra.filter((order) => !orderIds.has(order.id));
    return [...base, ...missing];
  }

  private isReadyLikeStatus(status: string): boolean {
    const value = status.trim().toUpperCase();
    return value === 'READY' || value === 'PARTIALLY_READY' || value === 'PARTICALLY_READY';
  }

  private getCachedReadyOrders(): Order[] {
    if (typeof localStorage === 'undefined') {
      return [];
    }

    try {
      const raw = localStorage.getItem(this.readyOrdersCacheKey);
      if (!raw) {
        return [];
      }

      const parsed = JSON.parse(raw) as unknown;
      if (!Array.isArray(parsed)) {
        return [];
      }

      return parsed
        .map((item) => this.normalizeCachedOrder(item))
        .filter((item): item is Order => item != null);
    } catch {
      return [];
    }
  }

  private saveCachedReadyOrders(orders: Order[]): void {
    if (typeof localStorage === 'undefined') {
      return;
    }

    try {
      localStorage.setItem(this.readyOrdersCacheKey, JSON.stringify(orders.slice(0, 100)));
    } catch {
      // Ignore storage quota or serialization errors.
    }
  }

  private normalizeCachedOrder(source: unknown): Order | null {
    if (!source || typeof source !== 'object' || Array.isArray(source)) {
      return null;
    }

    const raw = source as Record<string, unknown>;
    const id = Number(raw['id']);
    if (!Number.isFinite(id) || id <= 0) {
      return null;
    }

    return {
      id,
      kitchenOrderId: raw['kitchenOrderId'] != null ? Number(raw['kitchenOrderId']) : undefined,
      isSentToKitchen: true,
      tableId: Number(raw['tableId'] ?? 0),
      orderNumber: String(raw['orderNumber'] ?? `ORD-${id}`),
      status: this.normalizeStatus(raw['status'] ?? 'READY'),
      waiterId: raw['waiterId'] != null ? Number(raw['waiterId']) : undefined,
      waiterName: raw['waiterName'] != null ? String(raw['waiterName']) : undefined,
      items: this.normalizeOrderItems(raw['items'], id),
    } satisfies Order;
  }

  private normalizeAssignments(
    response: unknown
  ): Array<{ kitchenOrderId: number; waiterId: number; waiterName: string }> {
    return this.extractArray<Record<string, unknown>>(response)
      .map((raw) => ({
        kitchenOrderId: Number(raw['kitchenOrderId']),
        waiterId: Number(raw['waiterId']),
        waiterName: String(raw['waiterName'] ?? ''),
      }))
      .filter((item) => Number.isFinite(item.kitchenOrderId) && item.kitchenOrderId > 0);
  }

  private normalizeWaiters(response: unknown): Waiter[] {
    const source = this.extractArray<Record<string, unknown>>(response);

    return source
      .map((raw) => {
        const id = Number(raw['id'] ?? raw['waiterId'] ?? raw['userId']);
        const firstName = raw['firstName'] != null ? String(raw['firstName']) : '';
        const lastName = raw['lastName'] != null ? String(raw['lastName']) : '';
        const fallbackName = `${firstName} ${lastName}`.trim();

        return {
          id,
          name: String(raw['name'] ?? raw['fullName'] ?? fallbackName ?? '').trim(),
          status: String(raw['status'] ?? raw['availability'] ?? 'active'),
        } satisfies Waiter;
      })
      .filter((waiter) => Number.isFinite(waiter.id) && waiter.id > 0 && waiter.name.length > 0);
  }

  private normalizeChefs(response: unknown): Chef[] {
    const source = this.extractArray<Record<string, unknown>>(response);

    return source
      .map((raw) => {
        const id = Number(raw['id'] ?? raw['chefId'] ?? raw['userId']);
        const firstName = raw['firstName'] != null ? String(raw['firstName']) : '';
        const lastName = raw['lastName'] != null ? String(raw['lastName']) : '';
        const fallbackName = `${firstName} ${lastName}`.trim();

        return {
          id,
          name: String(raw['name'] ?? raw['fullName'] ?? fallbackName ?? '').trim(),
          status: String(raw['status'] ?? raw['availability'] ?? 'active'),
        } satisfies Chef;
      })
      .filter((chef) => Number.isFinite(chef.id) && chef.id > 0 && chef.name.length > 0);
  }

  private isWaiterAvailable(status: string): boolean {
    const normalized = status.trim().toUpperCase();
    return normalized === '' || normalized === 'ACTIVE' || normalized === 'AVAILABLE' || normalized === 'ON_DUTY' || normalized === 'ON-DUTY';
  }

  private normalizeStatus(status: unknown): string {
    const value = String(status ?? '').trim().toUpperCase();

    if (!value || value === 'OPEN' || value === 'PENDING' || value === 'NEW') {
      return 'RECEIVED';
    }

    if (value === 'IN_PROGRESS' || value === 'IN-PROGRESS') {
      return 'PREPARING';
    }

    if (value === 'SENT' || value === 'SENT_TO_KITCHEN' || value === 'QUEUED' || value === 'KITCHEN_QUEUE') {
      return 'PREPARING';
    }

    if (value === 'PARTIALLY_READY' || value === 'PARTICALLY_READY') {
      return 'READY';
    }

    return value;
  }

  private extractArray<T>(response: unknown): T[] {
    if (Array.isArray(response)) {
      return response as T[];
    }

    const obj = response as Record<string, unknown> | null;
    const keys = ['data', 'result', 'results', 'items', 'payload', 'content', 'orderItems', 'orderItemDtos', 'orderDetails'];

    for (const key of keys) {
      const value = obj?.[key];
      if (Array.isArray(value)) {
        return value as T[];
      }
    }

    return [];
  }

  private extractObject<T>(response: unknown): T | null {
    if (!response || typeof response !== 'object' || Array.isArray(response)) {
      return null;
    }

    const raw = response as Record<string, unknown>;
    const keys = ['data', 'result', 'payload', 'content'];

    for (const key of keys) {
      const value = raw[key];
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        return value as T;
      }
    }

    return raw as T;
  }
}
