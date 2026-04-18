import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterOutlet } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { Subscription, interval } from 'rxjs';
import { environment } from '../../../environments/environment';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { Sidebar } from '../sidebar/sidebar';

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
  selector: 'app-admin',
  imports: [CommonModule, FormsModule, Sidebar, RouterOutlet],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin implements OnInit, OnDestroy {
  // Tab management
  activeTab: 'dashboard' | 'tables' | 'sections' | 'floorplan' = 'dashboard';

  // Data
  sections: Section[] = [];
  allTables: Table[] = [];
  selectedSectionId: number | null = null;

  // State
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  editMode: boolean = false;
  draggedTable: Table | null = null;
  dragOffsetX: number = 0;
  dragOffsetY: number = 0;

  // Form data
  newTableNumber: string = '';
  newCapacity: number = 4;
  newSectionId: number = 1;
  newTableId: number | null = null;

  newSectionName: string = '';
  editingSectionId: number | null = null;

  // Canvas
  canvasWidth: number = 1200;
  canvasHeight: number = 700;
  gridSize: number = 10;

  // WebSocket
  private ws$?: WebSocketSubject<any>;
  private wsSubscription?: Subscription;
  private autoRefreshSubscription?: Subscription;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTables();
    this.loadSections();
    this.connectWebSocket();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
    }
    if (this.ws$) {
      this.ws$.complete();
    }
  }

  /**
   * Connect WebSocket for real-time updates
   */
  connectWebSocket(): void {
    try {
      const wsUrl = environment.apiUrl.replace(/^http/, 'ws') + '/table-updates';
      this.ws$ = webSocket({
        url: wsUrl,
        openObserver: {
          next: () => console.log('Admin WebSocket connected')
        },
        closeObserver: {
          next: () => {
            console.log('Admin WebSocket disconnected, reconnecting...');
            setTimeout(() => this.connectWebSocket(), 3000);
          }
        }
      });

      this.wsSubscription = this.ws$.subscribe({
        next: (message: any) => {
          if (message.event === 'TABLE_STATUS_UPDATE') {
            this.handleTableStatusUpdate(message);
          }
        },
        error: (error) => {
          console.error('WebSocket error:', error);
          setTimeout(() => this.connectWebSocket(), 3000);
        }
      });
    } catch (error) {
      console.error('Error establishing WebSocket:', error);
    }
  }

  /**
   * Handle real-time table updates
   */
  handleTableStatusUpdate(event: any): void {
    const table = this.allTables.find(t => t.id === event.tableId);
    if (table) {
      table.status = event.status;
      table.updatedAt = event.timestamp || new Date().toISOString();
    }
  }

  /**
   * Auto-refresh every 30 seconds
   */
  startAutoRefresh(): void {
    this.autoRefreshSubscription = interval(30000).subscribe(() => {
      this.loadTables();
    });
  }

  /**
   * Load tables from backend
   */
  loadTables(): void {
    this.http.get<Table[]>(`${environment.apiUrl}/table-management`).subscribe({
      next: (tables) => {
        this.allTables = tables;
        if (this.sections.length > 0 && !this.selectedSectionId) {
          this.selectedSectionId = this.sections[0].id;
        }
      },
      error: (error) => {
        console.error('Error loading tables:', error);
        this.showError('Failed to load tables');
      }
    });
  }

  /**
   * Load sections
   */
  loadSections(): void {
    const sectionMap = new Map<number, Section>();
    this.allTables.forEach(table => {
      if (!sectionMap.has(table.sectionId)) {
        sectionMap.set(table.sectionId, {
          id: table.sectionId,
          name: `Section ${table.sectionId}`,
          displayOrder: table.sectionId
        });
      }
    });
    this.sections = Array.from(sectionMap.values()).sort((a, b) => a.id - b.id);
  }

  // ==================== DASHBOARD ====================

  getTableStats(): { available: number; occupied: number; reserved: number; cleaning: number; total: number } {
    return {
      available: this.allTables.filter(t => t.status === 'available').length,
      occupied: this.allTables.filter(t => t.status === 'occupied').length,
      reserved: this.allTables.filter(t => t.status === 'reserved').length,
      cleaning: this.allTables.filter(t => t.status === 'cleaning').length,
      total: this.allTables.length,
    };
  }

  // ==================== TABLE MANAGEMENT ====================

  async addTable(): Promise<void> {
    this.newTableId = null;
    this.newTableNumber = '';
    this.newCapacity = 4;
    this.newSectionId = this.sections[0]?.id || 1;

    const result = await Swal.fire({
      title: 'Add New Table',
      html: `
        <div class="text-left space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Table Number *</label>
            <input id="tableNumber" type="text" class="swal2-input" placeholder="e.g., T01, T02" style="width: 100%; margin: 0;">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Capacity (Seats) *</label>
            <input id="capacity" type="number" class="swal2-input" value="4" min="1" max="20" style="width: 100%; margin: 0;">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Section *</label>
            <select id="section" class="swal2-input" style="width: 100%; margin: 0;">
              ${this.sections.map(s => `<option value="${s.id}">${s.name}</option>`).join('')}
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Add Table',
      preConfirm: () => {
        const tableNumber = (document.getElementById('tableNumber') as HTMLInputElement).value;
        const capacity = (document.getElementById('capacity') as HTMLInputElement).value;
        const sectionId = (document.getElementById('section') as HTMLSelectElement).value;

        if (!tableNumber || !capacity) {
          Swal.showValidationMessage('Please fill in all fields');
          return false;
        }

        return { tableNumber, capacity: parseInt(capacity), sectionId: parseInt(sectionId) };
      }
    });

    if (result.isConfirmed && result.value) {
      const newTable: any = {
        tableNumber: result.value.tableNumber,
        capacity: result.value.capacity,
        sectionId: result.value.sectionId,
        status: 'available'
      };

      this.http.post(`${environment.apiUrl}/table-management`, newTable).subscribe({
        next: () => {
          this.showSuccess('Table added successfully');
          this.loadTables();
        },
        error: () => this.showError('Failed to add table')
      });
    }
  }

  async editTable(table: Table): Promise<void> {
    const result = await Swal.fire({
      title: `Edit Table ${table.tableNumber}`,
      html: `
        <div class="text-left space-y-3">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Table Number *</label>
            <input id="tableNumber" type="text" class="swal2-input" value="${table.tableNumber}" style="width: 100%; margin: 0;">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Capacity (Seats) *</label>
            <input id="capacity" type="number" class="swal2-input" value="${table.capacity}" min="1" max="20" style="width: 100%; margin: 0;">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Section *</label>
            <select id="section" class="swal2-input" style="width: 100%; margin: 0;">
              ${this.sections.map(s => `<option value="${s.id}" ${s.id === table.sectionId ? 'selected' : ''}>${s.name}</option>`).join('')}
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Status *</label>
            <select id="status" class="swal2-input" style="width: 100%; margin: 0;">
              <option value="available" ${table.status === 'available' ? 'selected' : ''}>Available</option>
              <option value="occupied" ${table.status === 'occupied' ? 'selected' : ''}>Occupied</option>
              <option value="reserved" ${table.status === 'reserved' ? 'selected' : ''}>Reserved</option>
              <option value="cleaning" ${table.status === 'cleaning' ? 'selected' : ''}>Cleaning</option>
            </select>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Save Changes',
      preConfirm: () => {
        const tableNumber = (document.getElementById('tableNumber') as HTMLInputElement).value;
        const capacity = (document.getElementById('capacity') as HTMLInputElement).value;
        const sectionId = (document.getElementById('section') as HTMLSelectElement).value;
        const status = (document.getElementById('status') as HTMLSelectElement).value;

        if (!tableNumber || !capacity) {
          Swal.showValidationMessage('Please fill in all fields');
          return false;
        }

        return { tableNumber, capacity: parseInt(capacity), sectionId: parseInt(sectionId), status };
      }
    });

    if (result.isConfirmed && result.value) {
      const updatedTable = {
        ...table,
        ...result.value
      };

      this.http.put(`${environment.apiUrl}/table-management/${table.id}`, updatedTable).subscribe({
        next: () => {
          this.showSuccess('Table updated successfully');
          this.loadTables();
        },
        error: () => this.showError('Failed to update table')
      });
    }
  }

  deleteTable(table: Table): void {
    Swal.fire({
      title: 'Delete Table?',
      text: `Are you sure you want to delete Table ${table.tableNumber}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      confirmButtonText: 'Delete',
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`${environment.apiUrl}/table-management/${table.id}`).subscribe({
          next: () => {
            this.showSuccess('Table deleted successfully');
            this.loadTables();
          },
          error: () => this.showError('Failed to delete table')
        });
      }
    });
  }

  // ==================== FLOOR PLAN EDITOR ====================

  getTablesForSection(): Table[] {
    return this.allTables.filter(t => t.sectionId === this.selectedSectionId);
  }

  getTablePosition(table: Table): { x: number; y: number } {
    if (table.posX !== null && table.posX !== undefined && table.posY !== null && table.posY !== undefined) {
      return { x: table.posX, y: table.posY };
    }

    const tablesInSection = this.getTablesForSection().sort((a, b) => a.id - b.id);
    const indexInSection = tablesInSection.findIndex(t => t.id === table.id);
    
    const rowIndex = Math.floor(indexInSection / 3);
    const colIndex = indexInSection % 3;
    
    const baseX = 50 + (colIndex * 180);
    const baseY = 50 + (rowIndex * 150);
    
    return { x: baseX, y: baseY };
  }

  onDragStart(event: DragEvent, table: Table): void {
    if (!this.editMode) return;
    event.dataTransfer!.effectAllowed = 'move';
    this.draggedTable = table;
    const rect = (event.target as HTMLElement).getBoundingClientRect();
    this.dragOffsetX = event.clientX - rect.left;
    this.dragOffsetY = event.clientY - rect.top;
  }

  onDragOver(event: DragEvent): void {
    if (!this.editMode) return;
    event.preventDefault();
    event.dataTransfer!.dropEffect = 'move';
  }

  onDrop(event: DragEvent): void {
    if (!this.editMode || !this.draggedTable) return;
    event.preventDefault();

    const canvas = (event.currentTarget as HTMLElement);
    const rect = canvas.getBoundingClientRect();
    const x = Math.max(0, Math.min(event.clientX - rect.left - this.dragOffsetX, this.canvasWidth - 128));
    const y = Math.max(0, Math.min(event.clientY - rect.top - this.dragOffsetY, this.canvasHeight - 112));

    this.draggedTable.posX = Math.round(x / this.gridSize) * this.gridSize;
    this.draggedTable.posY = Math.round(y / this.gridSize) * this.gridSize;
    this.draggedTable = null;
  }

  saveFloorLayout(): void {
    const updates = this.getTablesForSection().map(table =>
      this.http.put(`${environment.apiUrl}/table-management/${table.id}`, {
        posX: table.posX,
        posY: table.posY,
        sectionId: table.sectionId
      }).toPromise()
    );

    Promise.all(updates).then(() => {
      this.showSuccess('Floor layout saved');
      this.editMode = false;
    }).catch(() => {
      this.showError('Failed to save layout');
    });
  }

  // ==================== UTILITIES ====================

  getStatusColorClass(status: string): string {
    const statusMap: Record<string, string> = {
      available: 'bg-green-500',
      occupied: 'bg-red-500',
      reserved: 'bg-blue-500',
      cleaning: 'bg-yellow-500',
    };
    return statusMap[status] || 'bg-gray-400';
  }

  showError(message: string): void {
    this.errorMessage = message;
    setTimeout(() => (this.errorMessage = ''), 5000);
  }

  showSuccess(message: string): void {
    this.successMessage = message;
    setTimeout(() => (this.successMessage = ''), 5000);
  }
}
