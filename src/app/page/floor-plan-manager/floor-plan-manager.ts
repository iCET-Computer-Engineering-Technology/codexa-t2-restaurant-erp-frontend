import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { Subscription } from 'rxjs';
import { environment } from '../../../environments/environment';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';

interface Table {
  id: number;
  tableNumber: string;
  capacity: number;
  sectionId: number;
  status: 'available' | 'occupied' | 'reserved' | 'cleaning';
  posX?: number;
  posY?: number;
  updatedAt?: string;
}

interface Section {
  id: number;
  name: string;
  displayOrder?: number;
}

@Component({
  selector: 'app-floor-plan-manager',
  imports: [CommonModule, FormsModule],
  templateUrl: './floor-plan-manager.html',
  styleUrl: './floor-plan-manager.css',
})
export class FloorPlanManager implements OnInit, OnDestroy {
  sections: Section[] = [];
  allTables: Table[] = [];
  selectedSectionId: number | null = null;
  editMode: boolean = false;
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';

  // Drag and drop state
  draggedTable: Table | null = null;
  dragOffsetX: number = 0;
  dragOffsetY: number = 0;

  // Canvas dimensions
  canvasWidth: number = 1200;
  canvasHeight: number = 700;
  gridSize: number = 10;

  // WebSocket and real-time updates
  private ws$?: WebSocketSubject<any>;
  private wsSubscription?: Subscription;

  // Subscriptions
  private autoRefreshSubscription?: Subscription;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTables();
    this.connectWebSocket();
  }

  ngOnDestroy(): void {
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
    }
    if (this.ws$) {
      this.ws$.complete();
    }
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
  }

  /**
   * Connect to WebSocket for real-time table updates
   */
  connectWebSocket(): void {
    try {
      const wsUrl = environment.apiUrl.replace(/^http/, 'ws') + '/table-updates';
      this.ws$ = webSocket({
        url: wsUrl,
        openObserver: {
          next: () => {
            console.log('WebSocket connected');
          }
        },
        closeObserver: {
          next: () => {
            console.log('WebSocket disconnected, attempting to reconnect...');
            setTimeout(() => this.connectWebSocket(), 3000);
          }
        }
      });

      this.wsSubscription = this.ws$.subscribe({
        next: (message: any) => {
          if (message.event === 'TABLE_STATUS_UPDATE' || message.type === 'TABLE_STATUS_UPDATE') {
            this.handleTableStatusUpdate(message);
          }
        },
        error: (error) => {
          console.error('WebSocket error:', error);
          setTimeout(() => this.connectWebSocket(), 3000);
        }
      });
    } catch (error) {
      console.error('Error establishing WebSocket connection:', error);
    }
  }

  /**
   * Handle real-time table status updates
   */
  handleTableStatusUpdate(event: any): void {
    const tableId = event.tableId;
    const newStatus = event.status;
    
    const table = this.allTables.find(t => t.id === tableId);
    if (table) {
      const oldStatus = table.status;
      table.status = newStatus;
      table.updatedAt = event.timestamp || new Date().toISOString();
      
      if (oldStatus !== newStatus) {
        console.log(`Table ${table.tableNumber} status changed from ${oldStatus} to ${newStatus}`);
      }
    }
  }

  /**
   * Load tables from backend API
   */
  loadTables(): void {
    this.loading = true;
    this.http.get<Table[]>(`${environment.apiUrl}/table-management`).subscribe({
      next: (tables) => {
        this.allTables = tables;
        
        // Extract unique sections from tables
        const sectionMap = new Map<number, Section>();
        tables.forEach(table => {
          if (!sectionMap.has(table.sectionId)) {
            sectionMap.set(table.sectionId, {
              id: table.sectionId,
              name: `Section ${table.sectionId}`,
              displayOrder: table.sectionId
            });
          }
        });
        this.sections = Array.from(sectionMap.values()).sort((a, b) => a.id - b.id);
        
        if (this.sections.length > 0 && this.selectedSectionId === null) {
          this.selectedSectionId = this.sections[0].id;
        }
        this.loading = false;
      },
      error: (error) => {
        console.error('Error loading tables:', error);
        this.showError('Failed to load tables');
        this.loading = false;
      },
    });
  }

  /**
   * Get tables for selected section
   */
  getTablesForSelectedSection(): Table[] {
    return this.allTables.filter((t) => t.sectionId === this.selectedSectionId);
  }

  /**
   * Get unassigned tables (no position set)
   */
  getUnassignedTables(): Table[] {
    return this.allTables.filter((t) => !t.posX || !t.posY);
  }

  /**
   * Select section tab
   */
  selectSection(sectionId: number): void {
    this.selectedSectionId = sectionId;
  }

  /**
   * Toggle edit mode
   */
  toggleEditMode(): void {
    this.editMode = !this.editMode;
    if (!this.editMode) {
      this.showSuccess('Edit mode disabled');
    }
  }

  /**
   * Start dragging a table
   */
  onDragStart(event: DragEvent, table: Table): void {
    if (!this.editMode) return;
    
    this.draggedTable = table;
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.dragOffsetX = event.clientX - rect.left;
    this.dragOffsetY = event.clientY - rect.top;
    
    if (event.dataTransfer) {
      event.dataTransfer.effectAllowed = 'move';
      event.dataTransfer.setData('tableId', table.id.toString());
    }
  }

  /**
   * Handle drag over canvas
   */
  onDragOver(event: DragEvent): void {
    if (!this.editMode) return;
    event.preventDefault();
    if (event.dataTransfer) {
      event.dataTransfer.dropEffect = 'move';
    }
  }

  /**
   * Handle drop on canvas
   */
  onDrop(event: DragEvent): void {
    if (!this.editMode || !this.draggedTable) return;
    event.preventDefault();

    const rect = (event.currentTarget as HTMLElement).getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left - this.dragOffsetX, this.canvasWidth - 100));
    const y = Math.max(0, Math.min(event.clientY - rect.top - this.dragOffsetY, this.canvasHeight - 80));

    // Snap to grid
    const snappedX = Math.round(x / this.gridSize) * this.gridSize;
    const snappedY = Math.round(y / this.gridSize) * this.gridSize;

    this.draggedTable.posX = snappedX;
    this.draggedTable.posY = snappedY;
    this.draggedTable.sectionId = this.selectedSectionId || this.draggedTable.sectionId;
    this.draggedTable = null;
  }

  /**
   * Save layout changes
   */
  saveLayout(): void {
    this.loading = true;
    const updatePayload = this.allTables.map(t => ({
      id: t.id,
      sectionId: t.sectionId,
      posX: t.posX || 50,
      posY: t.posY || 50
    }));

    // Send updates to backend for each table
    this.allTables.forEach(table => {
      const payload = {
        posX: table.posX || 50,
        posY: table.posY || 50,
        sectionId: table.sectionId
      };
      
      this.http.put(`${environment.apiUrl}/table-management/${table.id}`, payload).subscribe({
        next: () => {
          console.log(`Table ${table.tableNumber} position updated`);
        },
        error: (error) => {
          console.error(`Failed to update table ${table.id}:`, error);
          this.showError(`Failed to update ${table.tableNumber}`);
        }
      });
    });

    this.loading = false;
    this.editMode = false;
    this.showSuccess('Layout saved successfully');
  }

  /**
   * Get table status color class
   */
  getStatusColorClass(status: string): string {
    const statusMap: Record<string, string> = {
      available: 'bg-green-500',
      occupied: 'bg-red-500',
      reserved: 'bg-blue-500',
      cleaning: 'bg-yellow-500',
    };
    return statusMap[status] || 'bg-gray-400';
  }

  /**
   * Show error message
   */
  showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => (this.errorMessage = ''), 5000);
  }

  /**
   * Show success message
   */
  showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => (this.successMessage = ''), 3000);
  }
}

