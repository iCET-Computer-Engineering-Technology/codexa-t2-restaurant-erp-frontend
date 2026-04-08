import { CommonModule, DOCUMENT, isPlatformBrowser} from '@angular/common';
import { ChangeDetectionStrategy, Component, DestroyRef, PLATFORM_ID, computed, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { catchError, forkJoin, of } from 'rxjs';
import { OrderResponse, RestaurantTable, Service } from './service';

interface StatusSummary {
  status: string;
  count: number;
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
  readonly isLoading = signal(false);
  readonly loadError = signal('');
  readonly orders = signal<OrderResponse[]>([]);
  readonly tables = signal<RestaurantTable[]>([]);

  readonly orderStatusSummary = computed<StatusSummary[]>(() => this.buildStatusSummary(this.orders().map((order) => order.status)));
  readonly tableStatusSummary = computed<StatusSummary[]>(() => this.buildStatusSummary(this.tables().map((table) => table.status)));

  readonly totalOrderAmount = computed(() =>
    this.orders().reduce((total, order) => total + order.totalAmount, 0)
  );

  private timerId?: ReturnType<typeof setInterval>;

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
  private readonly destroyRef = inject(DestroyRef);
  private readonly dashboardService = inject(Service);

  readonly isDarkMode = signal(true);


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

  formatStatus(status: string): string {
    if (!status) {
      return 'Unknown';
    }

    return status
      .split('_')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  itemCount(order: OrderResponse): number {
    return order.items?.reduce((count, item) => count + item.quantity, 0) ?? 0;
  }

  private loadDashboardData(): void {
    this.isLoading.set(true);
    this.loadError.set('');

    forkJoin({
      orders: this.dashboardService.getOrders(),
      tables: this.dashboardService.getTables(),
    })
      .pipe(
        takeUntilDestroyed(this.destroyRef),
        catchError(() => {
          this.loadError.set('Unable to load KPI data. Please check your API and try again.');
          return of({ orders: [], tables: [] });
        })
      )
      .subscribe(({ orders, tables }) => {
        this.orders.set(orders ?? []);
        this.tables.set(tables ?? []);
        this.isLoading.set(false);
      });
  }

  private buildStatusSummary(statuses: string[]): StatusSummary[] {
    const grouped = new Map<string, number>();

    statuses.forEach((status) => {
      const normalizedStatus = this.formatStatus(status);
      grouped.set(normalizedStatus, (grouped.get(normalizedStatus) ?? 0) + 1);
    });

    return Array.from(grouped.entries())
      .map(([status, count]) => ({ status, count }))
      .sort((a, b) => b.count - a.count);
  }
}
