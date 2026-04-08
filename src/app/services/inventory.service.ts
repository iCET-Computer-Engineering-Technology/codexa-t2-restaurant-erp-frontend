import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';
import { environment } from '../../environments/environment';

export interface LowStockAlert {
  id?: number;
  ingredientId: number;
  ingredientName?: string;
  currentStock?: number;
  lowStockThreshold?: number;
  reorderQuantity?: number;
  unit?: string;
  alertDate?: string;
  status?: string;
}

export interface LowStockThresholdRequest {
  lowStockThreshold: number;
  reorderQuantity?: number;
}

@Injectable({
  providedIn: 'root'
})
export class InventoryService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/inventory`;

  /**
   * Get all low stock alerts
   */
  getLowStockAlerts(): Observable<LowStockAlert[]> {
    return this.http.get<LowStockAlert[]>(`${this.apiUrl}/low-stock-alerts`).pipe(
      catchError((error) => {
        console.error('Error fetching low stock alerts:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update low stock threshold for an ingredient
   */
  updateLowStockThreshold(
    ingredientId: number,
    request: LowStockThresholdRequest
  ): Observable<any> {
    return this.http
      .patch<any>(
        `${this.apiUrl}/ingredients/${ingredientId}/low-stock-threshold`,
        request
      )
      .pipe(
        catchError((error) => {
          console.error('Error updating low stock threshold:', error);
          return throwError(() => error);
        })
      );
  }
}
