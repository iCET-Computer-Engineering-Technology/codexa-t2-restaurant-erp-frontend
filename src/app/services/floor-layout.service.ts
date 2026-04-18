import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  FloorSection,
  FloorLayoutResponse,
  UpdateLayoutRequest,
  CreateSectionRequest,
  UpdateSectionRequest,
  TablePosition,
} from '../models/floor-layout.model';

@Injectable({
  providedIn: 'root',
})
export class FloorLayoutService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/floor-sections`;

  /**
   * Get all floor sections
   */
  getSections(): Observable<FloorSection[]> {
    return this.http.get<FloorSection[]>(this.apiUrl).pipe(
      catchError((error) => {
        console.error('Error fetching sections:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get section by ID
   */
  getSectionById(id: number): Observable<FloorSection> {
    return this.http.get<FloorSection>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error fetching section ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Create new floor section
   */
  createSection(request: CreateSectionRequest): Observable<FloorSection> {
    return this.http.post<FloorSection>(this.apiUrl, request).pipe(
      catchError((error) => {
        console.error('Error creating section:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Update floor section
   */
  updateSection(id: number, request: UpdateSectionRequest): Observable<FloorSection> {
    return this.http.put<FloorSection>(`${this.apiUrl}/${id}`, request).pipe(
      catchError((error) => {
        console.error(`Error updating section ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Delete floor section
   */
  deleteSection(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      catchError((error) => {
        console.error(`Error deleting section ${id}:`, error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get full floor layout (sections + tables with positions)
   */
  getFullLayout(): Observable<FloorLayoutResponse> {
    return this.http.get<FloorLayoutResponse>(`${this.apiUrl}/layout`).pipe(
      catchError((error) => {
        console.error('Error fetching full layout:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Save floor layout (batch update table positions)
   */
  saveLayout(request: UpdateLayoutRequest): Observable<void> {
    return this.http.put<void>(`${this.apiUrl}/layout`, request).pipe(
      catchError((error) => {
        console.error('Error saving layout:', error);
        return throwError(() => error);
      })
    );
  }

  /**
   * Get tables by section ID
   */
  getTablesBySection(sectionId: number): Observable<TablePosition[]> {
    return this.http.get<TablePosition[]>(`${this.apiUrl}/${sectionId}/tables`).pipe(
      catchError((error) => {
        console.error(`Error fetching tables for section ${sectionId}:`, error);
        return throwError(() => error);
      })
    );
  }
}
