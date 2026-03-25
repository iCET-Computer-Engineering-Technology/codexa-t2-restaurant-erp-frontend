import { CommonModule, DOCUMENT, isPlatformBrowser} from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { environment } from '../../../environments/environment';

interface OrderMetric {
  title: string;
  value: string;
  change: string;
  footnote: string;
  progress: number;
  negative?: boolean;
}

interface RevenueMetric {
  title: string;
  amount: number;
  change: string;
  footnote: string;
  progress: number;
  negative?: boolean;
}

interface PopularOrder {
  rank: number;
  item: string;
  category: string;
  ordersSold: number;
  revenue: number;
  share: number;
}

interface IngredientSummary {
  count: number;
  lowStockCount: number;
}

@Component({
  selector: 'app-kpi-dashboard',
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './kpi-dashboard.html',
  styleUrl: './kpi-dashboard.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class KpiDashboard implements OnInit, OnDestroy {
  greeting: string = '';
  today: Date = new Date();
  readonly currencyCode = 'LKR';
  isLoading = false;
  loadError = '';
  ingredientSummary: IngredientSummary = {
    count: 0,
    lowStockCount: 0,
  };

  private timerId?: ReturnType<typeof setInterval>;

  orderMetrics: OrderMetric[] = [
    {
      title: 'Orders Received',
      value: '284',
      change: '+18.2%',
      footnote: 'Compared to yesterday',
      progress: 79,
    },
    {
      title: 'In Kitchen',
      value: '42',
      change: '-6.7%',
      footnote: 'Lower than last peak',
      progress: 46,
      negative: true,
    },
    {
      title: 'Ready To Serve',
      value: '96',
      change: '+9.4%',
      footnote: 'Last 4 operational hours',
      progress: 67,
    },
    {
      title: 'Completed Orders',
      value: '247',
      change: '+12.6%',
      footnote: 'Completion rate: 87%',
      progress: 87,
    }
  ];

  revenueMetrics: RevenueMetric[] = [
    {
      title: 'Revenue Today',
      amount: 423500,
      change: '+14.3%',
      footnote: 'Gross sales in current shift',
      progress: 74,
    },
    {
      title: 'Average Ticket',
      amount: 1490,
      change: '+4.8%',
      footnote: 'Per customer bill',
      progress: 58,
    },
    {
      title: 'Weekly Revenue',
      amount: 2750000,
      change: '+8.1%',
      footnote: 'Accumulated over 7 days',
      progress: 81,
    },
    {
      title: 'Refunds',
      amount: 24300,
      change: '-2.9%',
      footnote: 'Refund value this week',
      progress: 19,
      negative: true,
    }
  ];

  popularOrders: PopularOrder[] = [
    {
      rank: 1,
      item: 'Chicken Kottu',
      category: 'Main Course',
      ordersSold: 142,
      revenue: 411800,
      share: 21,
    },
    {
      rank: 2,
      item: 'Cheese Burger Combo',
      category: 'Combo Meal',
      ordersSold: 118,
      revenue: 354000,
      share: 17,
    },
    {
      rank: 3,
      item: 'Seafood Nasi Goreng',
      category: 'Rice Bowl',
      ordersSold: 101,
      revenue: 333300,
      share: 15,
    },
    {
      rank: 4,
      item: 'Hot Butter Cuttlefish',
      category: 'Signature Dish',
      ordersSold: 93,
      revenue: 316200,
      share: 13,
    },
    {
      rank: 5,
      item: 'Margarita Pizza',
      category: 'Fast Casual',
      ordersSold: 89,
      revenue: 267000,
      share: 12,
    },
    {
      rank: 6,
      item: 'Chocolate Brownie Sundae',
      category: 'Dessert',
      ordersSold: 72,
      revenue: 133200,
      share: 10,
    }
  ];

  ngOnInit(): void {
    this.updateGreeting();
    this.loadDashboardData();

    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    this.timerId = setInterval(() => {
      this.today = new Date();
    }, 60000);
  }

  ngOnDestroy(): void {
    if (this.timerId) {
      clearInterval(this.timerId);
    }
  }

  updateGreeting(): void {
    const getHours = new Date().getHours();
    if (getHours < 12) {
      this.greeting = 'Good morning!';
    } else if (getHours < 17) {
      this.greeting = 'Good afternoon!';
    } else {
      this.greeting = 'Good evening!';
    }
  }

  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly http = inject(HttpClient);
  private readonly destroyRef = inject(DestroyRef);

  readonly isDarkMode = signal(true);

  private readonly apiRoot = environment.apiUrl.replace(/\/api\/?$/, '');

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const savedTheme = localStorage.getItem('admin-sidebar-theme');
    if (savedTheme === 'light') {
      this.isDarkMode.set(false);
    }

    this.applyTheme();
  }

  toggleTheme(): void {
    this.isDarkMode.update((currentMode) => !currentMode);
    this.applyTheme();
  }

  private applyTheme(): void {
    const darkModeEnabled = this.isDarkMode();

    this.document.documentElement.classList.toggle('admin-light-theme', !darkModeEnabled);
    localStorage.setItem('admin-sidebar-theme', darkModeEnabled ? 'dark' : 'light');
  }

  loadDashboardData(): void {
    this.isLoading = true;
    this.loadError = '';

    forkJoin({
      orders: this.http
        .get<unknown>(`${environment.apiUrl}/order/find-all`)
        .pipe(catchError(() => of([]))),
      ingredients: this.http
        .get<unknown>(`${this.apiRoot}/ingredient?page=0&size=10`)
        .pipe(catchError(() => of([]))),
    })
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(({ orders, ingredients }) => {
        const parsedOrders = this.extractArray<any>(orders);
        const parsedIngredients = this.extractArray<any>(ingredients);

        this.ingredientSummary = this.buildIngredientSummary(parsedIngredients);
        this.orderMetrics = this.buildOrderMetrics(parsedOrders);
        this.revenueMetrics = this.buildRevenueMetrics(parsedOrders);
        this.popularOrders = this.buildPopularOrders(parsedOrders);

        this.isLoading = false;

        if (parsedOrders.length === 0 && parsedIngredients.length === 0) {
          this.loadError = 'Unable to load dashboard data from the API endpoints.';
        }
      });
  }

  private buildIngredientSummary(ingredients: any[]): IngredientSummary {
    const lowStockCount = ingredients.filter((item) => {
      const quantity = Number(item?.quantity ?? item?.stockQuantity ?? item?.availableQty ?? 0);
      const threshold = Number(item?.reorderLevel ?? item?.threshold ?? item?.minStock ?? 10);
      return Number.isFinite(quantity) && Number.isFinite(threshold) && quantity <= threshold;
    }).length;

    return {
      count: ingredients.length,
      lowStockCount,
    };
  }

  private buildOrderMetrics(orders: any[]): OrderMetric[] {
    const totalOrders = orders.length;
    const inKitchen = orders.filter((o) => this.matchStatus(o, ['IN_KITCHEN', 'PREPARING', 'COOKING'])).length;
    const readyToServe = orders.filter((o) => this.matchStatus(o, ['READY', 'READY_TO_SERVE'])).length;
    const completed = orders.filter((o) => this.matchStatus(o, ['COMPLETED', 'DELIVERED', 'SERVED'])).length;

    const completionRate = totalOrders > 0 ? Math.round((completed / totalOrders) * 100) : 0;

    return [
      {
        title: 'Orders Received',
        value: `${totalOrders}`,
        change: 'Live',
        footnote: 'From /api/order/find-all',
        progress: Math.min(100, totalOrders),
      },
      {
        title: 'In Kitchen',
        value: `${inKitchen}`,
        change: 'Live',
        footnote: 'Active kitchen queue',
        progress: totalOrders > 0 ? Math.round((inKitchen / totalOrders) * 100) : 0,
      },
      {
        title: 'Ready To Serve',
        value: `${readyToServe}`,
        change: 'Live',
        footnote: 'Orders awaiting handoff',
        progress: totalOrders > 0 ? Math.round((readyToServe / totalOrders) * 100) : 0,
      },
      {
        title: 'Completed Orders',
        value: `${completed}`,
        change: 'Live',
        footnote: `Completion rate: ${completionRate}%`,
        progress: completionRate,
      },
    ];
  }

  private buildRevenueMetrics(orders: any[]): RevenueMetric[] {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).getTime();
    const sevenDaysAgo = now.getTime() - 7 * 24 * 60 * 60 * 1000;

    let totalRevenue = 0;
    let revenueToday = 0;
    let weeklyRevenue = 0;

    for (const order of orders) {
      const amount = this.resolveOrderAmount(order);
      totalRevenue += amount;

      const created = this.resolveOrderDate(order);
      if (!created) {
        continue;
      }

      const createdTime = created.getTime();
      if (createdTime >= startOfToday) {
        revenueToday += amount;
      }
      if (createdTime >= sevenDaysAgo) {
        weeklyRevenue += amount;
      }
    }

    const averageTicket = orders.length > 0 ? Math.round(totalRevenue / orders.length) : 0;
    const refunded = orders
      .filter((o) => this.matchStatus(o, ['REFUNDED', 'CANCELLED']))
      .reduce((sum, o) => sum + this.resolveOrderAmount(o), 0);

    return [
      {
        title: 'Revenue Today',
        amount: Math.round(revenueToday),
        change: 'Live',
        footnote: 'From orders created today',
        progress: totalRevenue > 0 ? Math.round((revenueToday / totalRevenue) * 100) : 0,
      },
      {
        title: 'Average Ticket',
        amount: averageTicket,
        change: 'Live',
        footnote: 'Average per order',
        progress: averageTicket > 0 ? 65 : 0,
      },
      {
        title: 'Weekly Revenue',
        amount: Math.round(weeklyRevenue),
        change: 'Live',
        footnote: 'Last 7 days',
        progress: totalRevenue > 0 ? Math.round((weeklyRevenue / totalRevenue) * 100) : 0,
      },
      {
        title: 'Refunds / Cancellations',
        amount: Math.round(refunded),
        change: refunded > 0 ? 'Attention' : 'Healthy',
        footnote: 'Captured by status',
        progress: totalRevenue > 0 ? Math.round((refunded / totalRevenue) * 100) : 0,
        negative: refunded > 0,
      },
    ];
  }

  private buildPopularOrders(orders: any[]): PopularOrder[] {
    const itemMap = new Map<string, { category: string; ordersSold: number; revenue: number }>();

    for (const order of orders) {
      const items = this.extractOrderItems(order);
      for (const item of items) {
        const name = String(item?.menuItemName ?? item?.itemName ?? item?.name ?? 'Unknown Item').trim();
        const category = String(item?.categoryName ?? item?.category ?? 'General').trim();
        const quantity = Number(item?.quantity ?? 1) || 0;
        const lineTotal = Number(item?.lineTotal ?? item?.total ?? item?.price ?? 0) || 0;

        const current = itemMap.get(name) ?? { category, ordersSold: 0, revenue: 0 };
        current.ordersSold += quantity;
        current.revenue += lineTotal;
        if (!current.category) {
          current.category = category;
        }
        itemMap.set(name, current);
      }
    }

    const rows = Array.from(itemMap.entries())
      .map(([item, stats]) => ({ item, ...stats }))
      .sort((a, b) => b.ordersSold - a.ordersSold)
      .slice(0, 10);

    const totalTopOrders = rows.reduce((sum, row) => sum + row.ordersSold, 0);

    return rows.map((row, index) => ({
      rank: index + 1,
      item: row.item,
      category: row.category,
      ordersSold: row.ordersSold,
      revenue: Math.round(row.revenue),
      share: totalTopOrders > 0 ? Math.round((row.ordersSold / totalTopOrders) * 100) : 0,
    }));
  }

  private extractOrderItems(order: any): any[] {
    const candidates = [
      order?.items,
      order?.orderItems,
      order?.orderItemList,
      order?.details,
      order?.lineItems,
    ];

    for (const candidate of candidates) {
      if (Array.isArray(candidate)) {
        return candidate;
      }
    }

    return [];
  }

  private resolveOrderAmount(order: any): number {
    const amount = Number(
      order?.totalAmount ??
      order?.grandTotal ??
      order?.total ??
      order?.subTotal ??
      order?.subtotal ??
      order?.amount
    );

    if (Number.isFinite(amount)) {
      return amount;
    }

    return this.extractOrderItems(order).reduce((sum, item) => {
      const lineTotal = Number(item?.lineTotal ?? item?.total ?? item?.price ?? 0);
      const quantity = Number(item?.quantity ?? 1);
      if (!Number.isFinite(lineTotal)) {
        return sum;
      }
      return sum + (Number.isFinite(quantity) ? lineTotal * quantity : lineTotal);
    }, 0);
  }

  private resolveOrderDate(order: any): Date | null {
    const rawDate =
      order?.createdAt ??
      order?.createdDate ??
      order?.orderDate ??
      order?.timestamp;

    if (!rawDate) {
      return null;
    }

    const parsed = new Date(rawDate);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  private matchStatus(order: any, expected: string[]): boolean {
    const status = String(order?.status ?? order?.orderStatus ?? '').toUpperCase().replaceAll(' ', '_');
    return expected.includes(status);
  }

  private extractArray<T>(response: unknown): T[] {
    if (Array.isArray(response)) {
      return response as T[];
    }

    const obj = response as any;
    const keys = ['data', 'result', 'results', 'items', 'content', 'payload'];

    for (const key of keys) {
      if (Array.isArray(obj?.[key])) {
        return obj[key] as T[];
      }
    }

    return [];
  }

}
