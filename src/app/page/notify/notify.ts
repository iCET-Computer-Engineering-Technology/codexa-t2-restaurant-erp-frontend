import {
  Component,
  ChangeDetectionStrategy,
  signal,
  computed,
  inject,
  OnInit,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { interval, Subject, takeUntil } from 'rxjs';
import { switchMap } from 'rxjs/operators';

import { InventoryService, LowStockAlert } from '../../services/inventory.service';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-notify',
  imports: [CommonModule, FormsModule],
  templateUrl: './notify.html',
  styleUrl: './notify.css',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Notify implements OnInit, OnDestroy {
  private readonly inventoryService = inject(InventoryService);
  private readonly authService = inject(AuthService);

  // State signals
  alerts = signal<LowStockAlert[]>([]);
  isLoading = signal(false);
  error = signal<string | null>(null);
  isVisible = signal(true);
  selectedAlertId = signal<number | null>(null);
  newThreshold = signal<number>(0);

  // Drag position signals
  buttonTop = signal(20);
  buttonRight = signal(20);
  isDragging = signal(false);
  dragStartX = signal(0);
  dragStartY = signal(0);
  dragStartTop = signal(0);
  dragStartRight = signal(0);
  dragDistance = signal(0);

  // Computed
  allowedRoles = ['ROLE_ADMIN', 'ROLE_CHEF'];
  isUserAllowed = computed(() => {
    // First check if authenticated
    if (!this.authService.isAuthenticated()) {
      return false;
    }

    const userRole = this.authService.getRole();
    if (!userRole) return false;
    
    const normalized = this.normalizeRole(userRole);
    return this.allowedRoles.includes(normalized);
  });

  unreadCount = computed(() => this.alerts().length);

  private readonly destroy$ = new Subject<void>();
  private readonly REFRESH_INTERVAL = 30000; // 30 seconds

  ngOnInit(): void {
    if (!this.isUserAllowed()) {
      return;
    }

    // Initial fetch
    this.fetchAlerts();

    // Auto-refresh alerts every 30 seconds
    interval(this.REFRESH_INTERVAL)
      .pipe(
        switchMap(() => this.inventoryService.getLowStockAlerts()),
        takeUntil(this.destroy$)
      )
      .subscribe({
        next: (data) => this.alerts.set(data),
        error: (err) => console.error('Error auto-refreshing alerts:', err),
      });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  fetchAlerts(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.inventoryService.getLowStockAlerts().subscribe({
      next: (data) => {
        this.alerts.set(data);
        this.isLoading.set(false);
      },
      error: (err) => {
        console.error('Error fetching low stock alerts:', err);
        this.error.set('Failed to load alerts');
        this.isLoading.set(false);
      },
    });
  }

  openAlert(alert: LowStockAlert): void {
    this.selectedAlertId.set(alert.id || null);
    this.newThreshold.set(alert.lowStockThreshold || 0);
  }

  closeAlert(): void {
    this.selectedAlertId.set(null);
    this.newThreshold.set(0);
  }

  updateThreshold(): void {
    const alertId = this.selectedAlertId();
    if (!alertId) return;

    const alert = this.alerts().find((a) => a.id === alertId);
    if (!alert) return;

    const threshold = this.newThreshold();
    if (threshold <= 0) {
      this.error.set('Threshold must be greater than 0');
      return;
    }

    this.inventoryService
      .updateLowStockThreshold(alert.ingredientId, {
        lowStockThreshold: threshold,
      })
      .subscribe({
        next: () => {
          // Update local alert
          this.alerts.update((current) =>
            current.map((a) =>
              a.id === alertId
                ? { ...a, lowStockThreshold: threshold }
                : a
            )
          );
          this.closeAlert();
          this.error.set(null);
        },
        error: (err) => {
          console.error('Error updating threshold:', err);
          this.error.set('Failed to update threshold');
        },
      });
  }

  dismissAlert(id: number | undefined): void {
    if (!id) return;
    this.alerts.update((current) => current.filter((a) => a.id !== id));
  }

  toggleVisibility(): void {
    this.isVisible.update((v) => !v);
  }

  onDragStart(event: MouseEvent): void {
    this.isDragging.set(true);
    this.dragStartX.set(event.clientX);
    this.dragStartY.set(event.clientY);
    this.dragStartTop.set(this.buttonTop());
    this.dragStartRight.set(this.buttonRight());
    this.dragDistance.set(0);
    event.preventDefault();
  }

  onDragMove(event: MouseEvent): void {
    if (!this.isDragging()) return;

    const deltaX = event.clientX - this.dragStartX();
    const deltaY = event.clientY - this.dragStartY();

    // Calculate total distance moved
    const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
    this.dragDistance.set(distance);

    // Update position
    const newTop = Math.max(0, this.dragStartTop() + deltaY);
    const newRight = Math.max(0, this.dragStartRight() - deltaX);

    this.buttonTop.set(newTop);
    this.buttonRight.set(newRight);
  }

  onDragEnd(): void {
    this.isDragging.set(false);
  }

  onMinimizedButtonClick(event: MouseEvent): void {
    // Only toggle if dragged distance is minimal (less than 5px threshold)
    if (this.dragDistance() < 5) {
      this.toggleVisibility();
    }
    this.dragDistance.set(0);
  }

  private normalizeRole(role: string): string {
    const trimmed = role.trim().toUpperCase();
    return trimmed.startsWith('ROLE_') ? trimmed : `ROLE_${trimmed}`;
  }
}
