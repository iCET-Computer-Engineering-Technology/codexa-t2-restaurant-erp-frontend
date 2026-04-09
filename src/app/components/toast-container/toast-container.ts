import { Component, OnInit } from '@angular/core';
import { ToastService } from '../../services/toast.service';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-toast-container',
  imports: [CommonModule],
  templateUrl: './toast-container.html',
  styleUrl: './toast-container.css',
})
export class ToastContainer implements OnInit {
  constructor(public toastService: ToastService) { }

  ngOnInit(): void {
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
