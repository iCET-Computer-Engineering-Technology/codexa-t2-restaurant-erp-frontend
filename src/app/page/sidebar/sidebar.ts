import {DOCUMENT, isPlatformBrowser} from '@angular/common';
import { ChangeDetectionStrategy, Component, PLATFORM_ID, inject, signal, computed } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-sidebar',
  standalone: true,
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

  readonly isDarkMode = signal(true);
  readonly isHovered = signal(false);

  // Get logged-in user info
  readonly username = signal<string | null>(null);
  readonly userRole = signal<string | null>(null);
  readonly avatarLetter = computed(() => {
    const user = this.username();
    return user ? user.charAt(0).toUpperCase() : 'A';
  });

  // Role-based visibility
  readonly showDashboard = computed(() => this.userRole() === 'ROLE_ADMIN');
  readonly showCustomers = computed(() => ['ROLE_ADMIN', 'ROLE_CASHIER'].includes(this.userRole() || ''));
  readonly showOrders = computed(() => ['ROLE_ADMIN', 'ROLE_CASHIER'].includes(this.userRole() || ''));
  readonly showKitchen = computed(() => ['ROLE_ADMIN', 'ROLE_CHEF'].includes(this.userRole() || ''));
  readonly showWaiter = computed(() => ['ROLE_ADMIN', 'ROLE_CASHIER'].includes(this.userRole() || ''));
  readonly showMarketing = computed(() => this.userRole() === 'ROLE_ADMIN');
  readonly showHR = computed(() => this.hasAnyRole(['ROLE_ADMIN', 'ROLE_MANAGER']));

  private hasAnyRole(roles: readonly string[]): boolean {
    const currentRole = this.userRole();
    return !!currentRole && roles.includes(currentRole);
  }

  // Dynamic routes based on role
  readonly customersRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_CASHIER' ? '/cashier/cashier-customer' : '/admin/admin-customer';
  });

  readonly ordersRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_CASHIER' ? '/cashier' : '/admin/admin-order';
  });

  readonly kitchenDashboardRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_CHEF' ? '/chef' : '/admin/kitchen';
  });

  // HR Manager routes based on role
  readonly hrAllowanceRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_ADMIN' ? '/admin/manager-allowance' : '/manager/manager-allowance';
  });

  readonly hrBasicSalaryRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_ADMIN' ? '/admin/manager-basic-salary' : '/manager/manager-basic-salary';
  });

  readonly hrBonusRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_ADMIN' ? '/admin/manager-bonus' : '/manager/manager-bonus';
  });

  readonly hrDeductionRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_ADMIN' ? '/admin/manager-deduction' : '/manager/manager-deduction';
  });

  readonly hrEmployeeRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_ADMIN' ? '/admin/manager-employee' : '/manager/manager-employee';
  });

  readonly hrEmployeeLeaveRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_ADMIN' ? '/admin/manager-employee-leave' : '/manager/manager-employee-leave';
  });

  readonly hrOvertimeRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_ADMIN' ? '/admin/manager-overtime' : '/manager/manager-overtime';
  });

  readonly hrPayrollConfigRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_ADMIN' ? '/admin/manager-payroll-config' : '/manager/manager-payroll-config';
  });

  readonly hrPayrollRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_ADMIN' ? '/admin/manager-payroll' : '/manager/manager-payroll';
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


  private applyTheme(): void {
    const darkModeEnabled = this.isDarkMode();

    this.document.documentElement.classList.toggle('admin-light-theme', !darkModeEnabled);
    localStorage.setItem('admin-sidebar-theme', darkModeEnabled ? 'dark' : 'light');
  }

}
