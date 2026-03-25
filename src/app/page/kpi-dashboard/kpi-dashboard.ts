import { CommonModule, DOCUMENT, isPlatformBrowser} from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal, OnDestroy, OnInit } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';

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

  private timerId?: ReturnType<typeof setInterval>;

  readonly orderMetrics: OrderMetric[] = [
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

  readonly revenueMetrics: RevenueMetric[] = [
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

  readonly popularOrders: PopularOrder[] = [
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

}
