import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info' | 'warning';
  duration?: number; // in milliseconds, default 3000
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  toasts = signal<Toast[]>([]);
  private toastIdCounter = 0;

  success(message: string, duration: number = 3000): void {
    this.addToast(message, 'success', duration);
  }

  error(message: string, duration: number = 3000): void {
    this.addToast(message, 'error', duration);
  }

  info(message: string, duration: number = 3000): void {
    this.addToast(message, 'info', duration);
  }

  warning(message: string, duration: number = 3000): void {
    this.addToast(message, 'warning', duration);
  }

  private addToast(message: string, type: 'success' | 'error' | 'info' | 'warning', duration: number): void {
    const id = `toast-${this.toastIdCounter++}`;
    const toast: Toast = { id, message, type, duration };

    // Add toast to array
    this.toasts.update((toasts) => [...toasts, toast]);

    // Auto-remove after duration
    if (duration > 0) {
      setTimeout(() => {
        this.removeToast(id);
      }, duration);
    }
  }

  removeToast(id: string): void {
    this.toasts.update((toasts) => toasts.filter((t) => t.id !== id));
  }

  clearAll(): void {
    this.toasts.set([]);
  }
}
