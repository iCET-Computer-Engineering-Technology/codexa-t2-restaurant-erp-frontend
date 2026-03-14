import { Component } from '@angular/core';
import { RouterOutlet, Router } from "@angular/router";
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-login',
  imports: [RouterOutlet, FormsModule, CommonModule],
  templateUrl: './login.html',
  styleUrl: './login.css',
  standalone: true
})
export class Login {
  username: string = '';
  password: string = '';
  isLoading: boolean = false;
  errorMessage: string = '';
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

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
        const token = response.token;
        const role = response.role || response.user?.role;
        
        if (token) {
          console.log('Token found, user role:', role);
          
          // Navigate based on user role
          if (role) {
            switch (role.toUpperCase()) {
              case 'ROLE_ADMIN':
                this.router.navigate(['/admin']);
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
          this.errorMessage = 'Invalid username or password';
        }
        this.isLoading = false;
      },
      error: (error) => {
      
        // Check if backend returned specific error messages
        const errorMessage = error.error?.message || error.message || '';
        
        if (errorMessage.toLowerCase().includes('username') || errorMessage.toLowerCase().includes('user')) {
          this.errorMessage = 'Username is incorrect';
        } else if (errorMessage.toLowerCase().includes('password')) {
          this.errorMessage = 'Password is incorrect';
        } else {
          this.errorMessage = 'Invalid username or password';
        }
        
        this.isLoading = false;
      }
    });
  }

  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }
}
