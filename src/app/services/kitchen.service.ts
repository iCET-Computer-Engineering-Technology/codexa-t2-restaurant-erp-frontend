import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, forkJoin, map, of, switchMap } from 'rxjs';

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
  activeOrdersCount: number;
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
    const params = new HttpParams().set('orderId', orderId);
    return this.http
      .post<void>(`${this.api}/kitchen/send`, null, { params })
      .pipe(map(() => undefined));
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
      [normalized],
    );

    this.saveCachedReadyOrders(merged);
  }

  private loadOrders(includePendingOpenOrders: boolean): Observable<Order[]> {
    return forkJoin({
      kitchenOrders: this.http.get<unknown>(`${this.api}/kitchen/orders`).pipe(
        map((response) => this.normalizeKitchenOrders(response)),
        catchError(() => of([])),
      ),
      openOrders: this.http.get<unknown>(`${this.api}/kitchen/open-orders`).pipe(
        map((response) => this.normalizeOpenOrders(response)),
        catchError(() => of([])),
      ),
      assignments: this.http.get<unknown>(`${this.api}/kitchen/assignments`).pipe(
        map((response) => this.normalizeAssignments(response)),
        catchError(() => of([])),
      ),
      allOrders: this.http.get<unknown>(`${this.api}/kitchen/orders`).pipe(
        map((response) => this.normalizeAllOrders(response)),
        catchError(() => of([])),
      ),
      menuItems: this.http.get<unknown>(`${this.api}/menu-items`).pipe(
        map((response) => this.normalizeMenuItemLookup(response)),
        catchError(() => of(new Map<number, string>())),
      ),
    }).pipe(
      switchMap(({ kitchenOrders, openOrders, assignments, allOrders, menuItems }) => {
        const detailByOrderId = new Map(openOrders.map((order) => [order.id, order]));
        const assignmentByKitchenOrderId = new Map<number, (typeof assignments)[number]>();
        const assignmentByOrderId = new Map<number, (typeof assignments)[number]>();

        assignments.forEach((item) => {
          if (item.kitchenOrderId && item.kitchenOrderId > 0) {
            assignmentByKitchenOrderId.set(item.kitchenOrderId, item);
          }

          if (item.orderId && item.orderId > 0) {
            assignmentByOrderId.set(item.orderId, item);
          }
        });
        const serverReadyHistory = allOrders.filter((order) =>
          this.isReadyLikeStatus(order.status),
        );
        const knownOrderIds = new Set<number>([
          ...allOrders.map((order) => order.id),
          ...openOrders.map((order) => order.id),
          ...kitchenOrders.map((kitchenOrder) => kitchenOrder.orderId),
        ]);
        const cachedReadyHistory = this.getCachedReadyOrders().filter((order) =>
          knownOrderIds.has(order.id),
        );

        // Keep local cache aligned to server-visible orders so deleted DB rows are not shown again.
        if (knownOrderIds.size > 0) {
          this.saveCachedReadyOrders(cachedReadyHistory);
        }

        const readyHistory = this.mergeMissingOrders(serverReadyHistory, cachedReadyHistory).map(
          (order) => ({
            ...order,
            isSentToKitchen: true,
            status: this.normalizeStatus(order.status),
          }),
        );

        if (kitchenOrders.length === 0) {
          if (!includePendingOpenOrders) {
            return of(
              this.applyMenuItemNames(this.mergeMissingOrders([], readyHistory), menuItems).sort(
                (a, b) => b.id - a.id,
              ),
            );
          }

          const withPending = this.mergeMissingOrders(
            openOrders.map((order) => ({ ...order, isSentToKitchen: false })),
            readyHistory,
          );

          return of(this.applyMenuItemNames(withPending, menuItems).sort((a, b) => b.id - a.id));
        }

        const detailRequests = kitchenOrders.map((kitchenOrder) => {
          return this.http
            .get<unknown>(`${this.api}/order/find-by-id/${kitchenOrder.orderId}`)
            .pipe(
              map((response) => this.normalizeOrderDetail(response)),
              catchError(() => of(detailByOrderId.get(kitchenOrder.orderId) ?? null)),
            );
        });

        return forkJoin(detailRequests).pipe(
          map((details) => {
            const merged = kitchenOrders.map((kitchenOrder, index) => {
              const detail = details[index] ?? detailByOrderId.get(kitchenOrder.orderId);
              const assignment =
                assignmentByKitchenOrderId.get(kitchenOrder.id) ??
                assignmentByOrderId.get(kitchenOrder.orderId);

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
              return this.applyMenuItemNames(withReadyHistory, menuItems).sort(
                (a, b) => b.id - a.id,
              );
            }

            // Keep any open orders that do not yet have a kitchen-order row.
            const kitchenOrderIds = new Set(merged.map((item) => item.id));
            const pending = openOrders
              .filter((order) => !kitchenOrderIds.has(order.id))
              .map((order) => ({
                ...order,
                isSentToKitchen: false,
                status: this.normalizeStatus(order.status),
              }));

            const withReadyHistory = this.mergeMissingOrders([...merged, ...pending], readyHistory);
            return this.applyMenuItemNames(withReadyHistory, menuItems).sort((a, b) => b.id - a.id);
          }),
        );
      }),
    );
  }

  getWaiters(): Observable<Waiter[]> {
    return this.http.get<unknown>(`${this.api}/kitchen/waiters`).pipe(
      map((response) => this.normalizeWaiters(response)),
      switchMap((waiters) => {
        if (waiters.length > 0) {
          return of(waiters);
        }

        return this.http.get<unknown>(`${this.api}/kitchen/available-waiters`).pipe(
          map((response) => this.normalizeWaiters(response)),
          catchError(() => of([])),
        );
      }),
      catchError(() =>
        this.http.get<unknown>(`${this.api}/kitchen/available-waiters`).pipe(
          map((response) => this.normalizeWaiters(response)),
          catchError(() => of([])),
        ),
      ),
    );
  }

  assignWaiter(kitchenOrderId: number, waiterId: number): Observable<void> {
    return this.http.post<void>(`${this.api}/kitchen/assign`, { kitchenOrderId, waiterId }).pipe(
      map(() => undefined),
    );
  }

  resolveKitchenOrderId(orderId: number): Observable<number | null> {
    const fromKitchenOrders = this.http.get<unknown>(`${this.api}/kitchen/orders`).pipe(
      map((response) => {
        const kitchenOrder = this
          .normalizeKitchenOrders(response)
          .find((item) => item.orderId === orderId);

        return kitchenOrder?.id ?? null;
      }),
      catchError(() => of(null)),
    );

    const fromAssignments = this.http.get<unknown>(`${this.api}/kitchen/assignments`).pipe(
      map((response) => {
        const assignment = this
          .normalizeAssignments(response)
          .find((item) => item.orderId === orderId);

        return assignment?.kitchenOrderId ?? null;
      }),
      catchError(() => of(null)),
    );

    return fromKitchenOrders.pipe(
      switchMap((kitchenOrderId) => {
        if (kitchenOrderId && kitchenOrderId > 0) {
          return of(kitchenOrderId);
        }

        return fromAssignments;
      }),
    );
  }

  updateOrderStatus(orderId: number, status: string): Observable<void> {
    const normalized = this.normalizeStatus(status);

    if (normalized === 'READY') {
      const params = new HttpParams().set('orderId', orderId);
      return this.http
        .post<void>(`${this.api}/kitchen/ready`, null, { params })
        .pipe(map(() => undefined));
    }

    // Backend currently rejects /api/order/update/{id}/status for non-READY states.
    // Keep local workflow smooth without firing that request.
    return of(undefined);
  }

  private normalizeKitchenOrders(
    response: unknown,
  ): Array<{ id: number; orderId: number; status: string }> {
    return this.extractArray<Record<string, unknown>>(response)
      .map((raw) => ({
        id: Number(raw['id']),
        orderId: Number(raw['orderId']),
        status: String(raw['status'] ?? ''),
      }))
      .filter(
        (order) => Number.isFinite(order.id) && order.id > 0 && Number.isFinite(order.orderId),
      );
  }

  private normalizeOpenOrders(response: unknown): Order[] {
    return this.extractArray<Record<string, unknown>>(response)
      .map((raw) => {
        const id = Number(raw['id']);
        const tableId = Number(raw['tableId'] ?? 0);
        const orderNumber = String(raw['orderNumber'] ?? `ORD-${id}`);
        const status = this.normalizeStatus(raw['status']);
        const items = this.normalizeOrderItems(
          raw['items'] ?? raw['orderItems'] ?? raw['orderItemDtos'] ?? raw['orderDetails'],
          id,
        );

        return {
          id,
          tableId: Number.isFinite(tableId) ? tableId : 0,
          orderNumber,
          status,
          items,
        } satisfies Order;
      })
      .filter((order) => Number.isFinite(order.id) && order.id > 0);
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
        id,
      ),
    } satisfies Order;
  }

  private normalizeAllOrders(response: unknown): Order[] {
    return this.extractArray<Record<string, unknown>>(response)
      .map((raw) => {
        const id = Number(raw['id'] ?? raw['orderId']);
        const tableId = Number(raw['tableId'] ?? 0);
        const orderNumber = String(raw['orderNumber'] ?? raw['order_no'] ?? `ORD-${id}`);
        const status = this.normalizeStatus(raw['status']);
        const items = this.normalizeOrderItems(
          raw['items'] ?? raw['orderItems'] ?? raw['orderItemDtos'] ?? raw['orderDetails'],
          id,
        );

        return {
          id,
          tableId: Number.isFinite(tableId) ? tableId : 0,
          orderNumber,
          status,
          items,
        } satisfies Order;
      })
      .filter((order) => Number.isFinite(order.id) && order.id > 0);
  }

  private normalizeOrderItems(items: unknown, fallbackOrderId: number): OrderItem[] {
    return this.extractArray<Record<string, unknown>>(items)
      .map((item) => {
        const quantity = Number(item['quantity'] ?? item['qty'] ?? item['count'] ?? 0);
        const unitPrice = Number(item['price'] ?? item['unitPrice'] ?? item['sellingPrice'] ?? 0);
        const orderId = Number(item['orderId'] ?? fallbackOrderId);
        const itemId = Number(item['id'] ?? 0);
        const menuItemId = Number(
          item['menuItemId'] ?? item['itemId'] ?? item['menu_item_id'] ?? 0,
        );
        const menuItemName =
          item['menuItemName'] ??
          item['itemName'] ??
          item['name'] ??
          (item['menuItem'] as Record<string, unknown>)?.['name'];
        const totalPrice = Number(
          item['lineTotal'] ?? item['totalPrice'] ?? item['subTotal'] ?? unitPrice * quantity,
        );

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
    response: unknown,
  ): Array<{ kitchenOrderId: number; orderId?: number; waiterId: number; waiterName: string }> {
    return this.extractArray<Record<string, unknown>>(response)
      .map((raw) => {
        const kitchenOrderRef = this.extractObject<Record<string, unknown>>(raw['kitchenOrder']);
        const kitchenOrderId = Number(raw['kitchenOrderId'] ?? kitchenOrderRef?.['id']);
        const orderId = Number(raw['orderId'] ?? kitchenOrderRef?.['orderId']);

        return {
          kitchenOrderId,
          orderId: Number.isFinite(orderId) && orderId > 0 ? orderId : undefined,
          waiterId: Number(raw['waiterId']),
          waiterName: String(raw['waiterName'] ?? ''),
        };
      })
      .filter(
        (item) =>
          (Number.isFinite(item.kitchenOrderId) && item.kitchenOrderId > 0) ||
          (item.orderId != null && Number.isFinite(item.orderId) && item.orderId > 0),
      );
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
          activeOrdersCount: Number(raw['activeOrdersCount'] ?? raw['active_count'] ?? 0),
        } satisfies Waiter;
      })
      .filter((waiter) => Number.isFinite(waiter.id) && waiter.id > 0 && waiter.name.length > 0);
  }

  private normalizeStatus(status: unknown): string {
    const value = String(status ?? '')
      .trim()
      .toUpperCase();

    if (!value || value === 'OPEN' || value === 'PENDING' || value === 'NEW') {
      return 'RECEIVED';
    }

    if (value === 'IN_PROGRESS' || value === 'IN-PROGRESS') {
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
    const keys = [
      'data',
      'result',
      'results',
      'items',
      'payload',
      'content',
      'orderItems',
      'orderItemDtos',
      'orderDetails',
    ];

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
