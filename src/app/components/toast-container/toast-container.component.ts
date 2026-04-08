import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ToastService } from '../../services/toast.service';

@Component({
  selector: 'app-toast-container',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="fixed right-0 top-0 z-50 space-y-3 p-4 pointer-events-none md:right-4 md:top-4">
      @for (toast of toastService.toasts(); track toast.id) {
        <div
          class="animate-slide-in pointer-events-auto flex items-start gap-3 rounded-lg border px-4 py-3 shadow-lg backdrop-blur-sm max-w-sm"
          [ngClass]="getToastClasses(toast.type)"
        >
          <!-- Icon -->
          <div class="flex-shrink-0 mt-0.5">
            <svg *ngIf="toast.type === 'success'" class="h-5 w-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            <svg *ngIf="toast.type === 'error'" class="h-5 w-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
            </svg>
            <svg *ngIf="toast.type === 'warning'" class="h-5 w-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
            </svg>
            <svg *ngIf="toast.type === 'info'" class="h-5 w-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd" />
            </svg>
          </div>

          <!-- Message -->
          <div class="flex-1 min-w-0">
            <p class="text-sm font-medium" [ngClass]="getTextColor(toast.type)">
              {{ toast.message }}
            </p>
          </div>

          <!-- Close Button -->
          <button
            (click)="toastService.removeToast(toast.id)"
            class="flex-shrink-0 inline-flex text-gray-400 hover:text-gray-600 transition-colors"
          >
            <span class="sr-only">Close</span>
            <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 11-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd" />
            </svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: translateX(100%);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    .animate-slide-in {
      animation: slideIn 0.3s ease-out;
    }
  `]
})
export class ToastContainerComponent implements OnInit {
  constructor(public toastService: ToastService) {}

  ngOnInit(): void {
    // Service is injected and ready to use
  }

  getToastClasses(type: string): string {
    const baseClasses = 'border';
    switch (type) {
      case 'success':
        return `${baseClasses} border-green-200 bg-green-50`;
      case 'error':
        return `${baseClasses} border-red-200 bg-red-50`;
      case 'warning':
        return `${baseClasses} border-yellow-200 bg-yellow-50`;
      case 'info':
        return `${baseClasses} border-blue-200 bg-blue-50`;
      default:
        return baseClasses;
    }
  }

  getTextColor(type: string): string {
    switch (type) {
      case 'success':
        return 'text-green-800';
      case 'error':
        return 'text-red-800';
      case 'warning':
        return 'text-yellow-800';
      case 'info':
        return 'text-blue-800';
      default:
        return 'text-gray-800';
    }
  }
}
