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
  readonly showMarketing = computed(() => this.userRole() === 'ROLE_ADMIN');
  readonly showInbox = computed(() => this.userRole() === 'ROLE_ADMIN');
  readonly showUsers = computed(() => this.userRole() === 'ROLE_ADMIN');
  readonly showProducts = computed(() => this.userRole() === 'ROLE_ADMIN');

  // Dynamic routes based on role
  readonly customersRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_CASHIER' ? '/cashier/cashier-customer' : '/admin/admin-customer';
  });

  readonly ordersRoute = computed(() => {
    const role = this.userRole();
    return role === 'ROLE_CASHIER' ? '/cashier' : '/admin/admin-order';
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