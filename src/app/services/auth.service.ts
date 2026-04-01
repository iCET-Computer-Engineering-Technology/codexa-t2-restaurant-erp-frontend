import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject, throwError } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token?: string;
  message?: string;
  AuthenticationException?: string;
  authenticationException?: string;
  success?: boolean;
  role?: string;
  user?: {
    id?: number;
    username?: string;
    role?: string;
  };
}

export interface RegisterRequest {
  username: string;
  password: string;
  role?: string;
}

interface ErrorResponse {
  error?: string;
  message?: string;
  AuthenticationException?: string;
  authenticationException?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly authApiUrl = 'http://localhost:8080/api/auth';
  private readonly loginApiUrl = `${this.authApiUrl}/login`;
  private readonly isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private readonly http: HttpClient) {}

  login(username: string, password: string): Observable<LoginResponse> {
    const loginRequest: LoginRequest = { username, password };
    console.log('Sending login request to:', this.loginApiUrl, loginRequest);

    return this.http.post<LoginResponse>(this.loginApiUrl, loginRequest).pipe(
      tap(response => {
        console.log('Login response received:', response);

        const token = response.token;
        const role = response.role || response.user?.role;
        const userId = response.user?.id;

        if (token) {
          localStorage.setItem('authToken', token);
          localStorage.setItem('username', username);
          if (role) {
            localStorage.setItem('userRole', role);
          }
          if (userId !== undefined && userId !== null) {
            localStorage.setItem('userId', String(userId));
          }
          this.isAuthenticatedSubject.next(true);
          console.log('Login successful, token stored, role:', role);
        }
      }),
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  register(request: RegisterRequest): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.authApiUrl}/register`, request).pipe(
      catchError((error: HttpErrorResponse) => this.handleError(error))
    );
  }

  private handleError(error: HttpErrorResponse): Observable<never> {
    console.error('Login error:', error);
    console.error('Error body:', error.error);

    const errorResponse = error.error as ErrorResponse;
    const backendMessage =
      errorResponse?.AuthenticationException ||
      errorResponse?.authenticationException ||
      errorResponse?.error ||
      errorResponse?.message ||
      (typeof error.error === 'string' ? error.error : '');

    let errorMessage = 'An error occurred';

    if (error.status === 401) {
      errorMessage = backendMessage || 'Username or password is wrong';
    } else if (error.status === 400) {
      errorMessage = backendMessage || 'Invalid request';
    } else if (error.status === 404) {
      errorMessage = backendMessage || 'Resource not found';
    } else if (error.status === 0) {
      errorMessage = 'Unable to connect to server';
    } else {
      errorMessage = backendMessage || error.message || 'An error occurred';
    }

    console.error('Final error message:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  logout(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('username');
    localStorage.removeItem('userRole');
    localStorage.removeItem('userId');
    this.isAuthenticatedSubject.next(false);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  getUsername(): string | null {
    return localStorage.getItem('username');
  }

  getRole(): string | null {
    return localStorage.getItem('userRole');
  }

  getUserId(): number | null {
    const raw = localStorage.getItem('userId');
    if (!raw) return null;
    const parsed = Number(raw);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private hasToken(): boolean {
    return !!localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return this.hasToken();
  }
}
