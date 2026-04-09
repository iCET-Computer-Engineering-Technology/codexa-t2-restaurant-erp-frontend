import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  imports: [RouterLink, RouterLinkActive],
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

  readonly isDarkMode = signal(false);
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
  readonly showDashboard = computed(() => this.userRole() === 'ROLE_ADMIN');
  readonly showCustomers = computed(() => ['ROLE_ADMIN', 'ROLE_CASHIER'].includes(this.userRole() || ''));
  readonly showOrders = computed(() => ['ROLE_ADMIN', 'ROLE_CASHIER'].includes(this.userRole() || ''));
  readonly showKitchen = computed(() => ['ROLE_ADMIN', 'ROLE_CHEF'].includes(this.userRole() || ''));
  readonly showWaiter = computed(() => ['ROLE_ADMIN', 'ROLE_CASHIER'].includes(this.userRole() || ''));
  readonly showMarketing = computed(() => this.userRole() === 'ROLE_ADMIN');
  readonly showInbox = computed(() => this.userRole() === 'ROLE_ADMIN');
  readonly showUsers = computed(() => this.userRole() === 'ROLE_ADMIN');
  readonly showProducts = computed(() => this.userRole() === 'ROLE_ADMIN');
  readonly showReservations = computed(() => ['ROLE_ADMIN', 'ROLE_CASHIER'].includes(this.userRole() || ''));
  readonly showRevenue = computed(() => this.userRole() === 'ROLE_ADMIN');

  readonly showHR = computed(() => this.hasAnyRole(['ROLE_ADMIN', 'ROLE_MANAGER']));
  readonly showSupplier = computed(() => this.hasAnyRole(['ROLE_ADMIN', 'ROLE_MANAGER']));

  // Dynamic routes based on role
  readonly customersRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_CASHIER' ? '/cashier/cashier-customer' : '/admin/admin-customer';
  });

  readonly ordersRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_CASHIER' ? '/cashier' : '/admin/admin-order';
  });

  readonly reservationsRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_CASHIER' ? '/cashier/reservations' : '/admin/reservations';
  });

  readonly kitchenDashboardRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_CHEF' ? '/chef' : '/admin/kitchen';
  });

  readonly kitchenOrderTableRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_CHEF' ? '/chef' : '/admin/kitchen';
  });

  readonly kitchenOrderAssignRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_CHEF' ? '/chef' : '/admin/kitchen';
  });
// HR Manager routes based on role
  readonly hrAllowanceRoute = computed(() => '/manager/manager-allowance');

  readonly hrBasicSalaryRoute = computed(() => '/manager/manager-basic-salary');

  readonly hrBonusRoute = computed(() => '/manager/manager-bonus');

  readonly hrDeductionRoute = computed(() => '/manager/manager-deduction');

  readonly hrEmployeeRoute = computed(() => '/manager/manager-employee');

  readonly hrEmployeeLeaveRoute = computed(() => '/manager/manager-employee-leave');

  readonly hrOvertimeRoute = computed(() => '/manager/manager-overtime');

  readonly hrPayrollConfigRoute = computed(() => '/manager/manager-payroll-config');

  readonly hrPayrollRoute = computed(() => '/manager/manager-payroll');

  readonly supplierRoute = computed(() => {
    return this.hasRole('ROLE_ADMIN') ? '/admin/admin-supplier' : '/manager/manager-supplier';
  });

  constructor() {
    if (!isPlatformBrowser(this.platformId)) {
      return;
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
