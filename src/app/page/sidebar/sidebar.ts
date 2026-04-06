import {DOCUMENT, isPlatformBrowser, CommonModule} from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './sidebar.html',
  styleUrl: './sidebar.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
  host: {
    '(mouseenter)': 'onMouseEnter()',
    '(mouseleave)': 'onMouseLeave()'
  }
})
export class Sidebar {
  private readonly document = inject(DOCUMENT);
  private readonly platformId = inject(PLATFORM_ID);
  private readonly authService = inject(AuthService);

  readonly isDarkMode = signal(true);
  readonly isHovered = signal(false);

  // Get logged-in user info
  readonly username = signal<string | null>(null);
  readonly userRole = signal<string | null>(null);
  readonly avatarLetter = computed(() => {
    const user = this.username();
    return user ? user.charAt(0).toUpperCase() : 'A';
  });

  private normalizeRole(role: string | null): string {
    const upper = (role ?? '').trim().toUpperCase();
    if (!upper) return '';
    return upper.startsWith('ROLE_') ? upper : `ROLE_${upper}`;
  }

  private hasRole(role: string): boolean {
    return this.normalizeRole(this.userRole()) === this.normalizeRole(role);
  }

  private hasAnyRole(roles: string[]): boolean {
    const currentRole = this.normalizeRole(this.userRole());
    return roles.map((r) => this.normalizeRole(r)).includes(currentRole);
  }

  // Role-based visibility
  readonly showDashboard = computed(() => this.hasRole('ROLE_ADMIN'));
  readonly showCustomers = computed(() => this.hasAnyRole(['ROLE_ADMIN', 'ROLE_CASHIER']));
  readonly showOrders = computed(() => this.hasAnyRole(['ROLE_ADMIN', 'ROLE_CASHIER']));
  readonly showKitchen = computed(() => this.hasAnyRole(['ROLE_ADMIN', 'ROLE_CHEF']));
  readonly showWaiter = computed(() => this.hasAnyRole(['ROLE_ADMIN', 'ROLE_CASHIER']));
  readonly showMarketing = computed(() => this.hasRole('ROLE_ADMIN'));
  readonly showInbox = computed(() => this.hasRole('ROLE_ADMIN'));
  readonly showUsers = computed(() => this.hasRole('ROLE_ADMIN'));
  readonly showProducts = computed(() => this.hasRole('ROLE_ADMIN'));
  readonly showReservations = computed(() => this.hasAnyRole(['ROLE_ADMIN', 'ROLE_CASHIER']));

  readonly showHR = computed(() => this.hasAnyRole(['ROLE_ADMIN', 'ROLE_MANAGER']));

  // Dynamic routes based on role
  readonly customersRoute = computed(() => {
    return this.hasRole('ROLE_CASHIER') ? '/cashier/cashier-customer' : '/admin/admin-customer';
  });

  readonly ordersRoute = computed(() => {
    return this.hasRole('ROLE_CASHIER') ? '/cashier' : '/admin/admin-order';
  });

  readonly reservationsRoute = computed(() => {
    return this.hasRole('ROLE_CASHIER') ? '/cashier/reservations' : '/admin/reservations';
  });

  readonly kitchenDashboardRoute = computed(() => {
    return this.hasRole('ROLE_CHEF') ? '/chef' : '/admin/kitchen/kitchen-dashboard';
  });

  readonly kitchenOrderTableRoute = computed(() => {
    return this.hasRole('ROLE_CHEF') ? '/chef/kitchen-oder-table' : '/admin/kitchen/kitchen-order-table';
  });

  readonly kitchenOrderAssignRoute = computed(() => {
    return this.hasRole('ROLE_CHEF') ? '/chef/order-assign' : '/admin/kitchen/order-assign';
  });

  // HR Manager routes based on role
  readonly hrAllowanceRoute = computed(() => {
    return this.hasRole('ROLE_ADMIN') ? '/admin/manager-allowance' : '/manager/manager-allowance';
  });

  readonly hrBasicSalaryRoute = computed(() => {
    return this.hasRole('ROLE_ADMIN') ? '/admin/manager-basic-salary' : '/manager/manager-basic-salary';
  });

  readonly hrBonusRoute = computed(() => {
    return this.hasRole('ROLE_ADMIN') ? '/admin/manager-bonus' : '/manager/manager-bonus';
  });

  readonly hrDeductionRoute = computed(() => {
    return this.hasRole('ROLE_ADMIN') ? '/admin/manager-deduction' : '/manager/manager-deduction';
  });

  readonly hrEmployeeRoute = computed(() => {
    return this.hasRole('ROLE_ADMIN') ? '/admin/manager-employee' : '/manager/manager-employee';
  });

  readonly hrEmployeeLeaveRoute = computed(() => {
    return this.hasRole('ROLE_ADMIN') ? '/admin/manager-employee-leave' : '/manager/manager-employee-leave';
  });

  readonly hrOvertimeRoute = computed(() => {
    return this.hasRole('ROLE_ADMIN') ? '/admin/manager-overtime' : '/manager/manager-overtime';
  });

  readonly hrPayrollConfigRoute = computed(() => {
    return this.hasRole('ROLE_ADMIN') ? '/admin/manager-payroll-config' : '/manager/manager-payroll-config';
  });

  readonly hrPayrollRoute = computed(() => {
    return this.hasRole('ROLE_ADMIN') ? '/admin/manager-payroll' : '/manager/manager-payroll';
  });

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
    }

    const savedTheme = localStorage.getItem('admin-sidebar-theme');
    if (savedTheme === 'light') {
      this.isDarkMode.set(false);
    } else if (savedTheme === 'dark') {
      this.isDarkMode.set(true);
    }

    // Load user info
    const storedUsername = this.authService.getUsername();
    const storedRole = this.authService.getRole();

    if (storedUsername) {
      this.username.set(storedUsername);
    }
    if (storedRole) {
      this.userRole.set(storedRole);
    }
    this.applyTheme();
  }

  onMouseEnter(): void {
    this.isHovered.set(true);
  }

  onMouseLeave(): void {
    this.isHovered.set(false);
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
