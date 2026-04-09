import { Component, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { Router } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';


@Component({
  selector: 'app-login',
  imports: [FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class Login {
  username: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  showPassword: boolean = false;

  constructor(
    private readonly authService: AuthService,
    private readonly router: Router,
    private readonly cdr: ChangeDetectorRef
  ) {}

  private extractBackendMessage(payload: unknown): string {
    console.log('Extracting message from:', payload, 'Type:', typeof payload);

    if (!payload) {
      return '';
    }

    if (typeof payload === 'string') {
      return payload;
    }

    if (payload instanceof Error) {
      const msg = payload.message || '';
      console.log('Extracted from Error.message:', msg);
      return msg;
    }

    if (typeof payload !== 'object') {
      return '';
    }

    const data = payload as Record<string, unknown>;
    const preferredKeys = ['AuthenticationException', 'authenticationException', 'message', 'error', 'detail', 'title'];

    for (const key of preferredKeys) {
      const value = data[key];
      if (typeof value === 'string' && value.trim()) {
        console.log('Extracted from key', key, ':', value);
        return value;
      }
    }

    for (const [key, value] of Object.entries(data)) {
      if (key.toLowerCase().includes('exception') && typeof value === 'string' && value.trim()) {
        console.log('Extracted from exception key', key, ':', value);
        return value;
      }
    }

    return '';
  }

  handleAdminLogin(event: Event): void {
    event.preventDefault();

    if (!this.username || !this.password) {
      this.errorMessage = 'Please enter username and password';
      return;
    }

    this.isLoading = true;
    this.errorMessage = '';

    this.authService.login(this.username, this.password).subscribe({
      next: (response) => {
        console.log('Login success response:', response);
        const token = response.token;
        const role = response.role || response.user?.role;
        const authenticationExceptionMessage = this.extractBackendMessage(response);

        if (token) {
          console.log('Token found, user role:', role);

          // Navigate based on user role
          if (role) {
            switch (role.toUpperCase()) {
              case 'ROLE_ADMIN':
                this.router.navigate(['/admin']);
                break;
              case 'ROLE_MANAGER':
                this.router.navigate(['/manager']);
                break;
              case 'ROLE_CASHIER':
                this.router.navigate(['/cashier']);
                break;
              case 'ROLE_WAITER':
                this.router.navigate(['/waiter']);
                break;
              case 'ROLE_CHEF':
                this.router.navigate(['/chef']);
                break;
              default:
                this.router.navigate(['/dashboard']);
            }
          } else {
            this.router.navigate(['/dashboard']);
          }
        } else {
          console.log('No token found, auth message:', authenticationExceptionMessage);
          this.errorMessage = authenticationExceptionMessage || 'Invalid username or password';
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.log('Login error received:', error, 'error.error:', error?.error);
        const authenticationExceptionMessage =
          this.extractBackendMessage(error?.error) ||
          this.extractBackendMessage(error);

        const finalError = authenticationExceptionMessage || 'Invalid username or password';
        console.log('Final error to display:', finalError);
        this.errorMessage = finalError;
        console.log('errorMessage property set to:', this.errorMessage);
        this.cdr.markForCheck();

        this.isLoading = false;
        this.cdr.markForCheck();
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
