import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { Subscription, interval } from 'rxjs';
import { environment } from '../../../environments/environment';

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
  selector: 'app-floor-plan-cashier',
  imports: [CommonModule, FormsModule],
  templateUrl: './floor-plan-cashier.html',
  styleUrl: './floor-plan-cashier.css',
})
export class FloorPlanCashier implements OnInit, OnDestroy {
  sections: Section[] = [];
  allTables: Table[] = [];
  selectedSectionId: number | null = null;
  loading: boolean = false;
  errorMessage: string = '';
  filterStatus: string = '';
  
  // Canvas dimensions
  canvasWidth: number = 1200;
  canvasHeight: number = 700;

  // Subscriptions
  private wsSubscription?: Subscription;
  private autoRefreshSubscription?: Subscription;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadTables();
    this.startAutoRefresh();
  }

  ngOnDestroy(): void {
    if (this.wsSubscription) {
      this.wsSubscription.unsubscribe();
    }
    if (this.autoRefreshSubscription) {
      this.autoRefreshSubscription.unsubscribe();
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
   * Start auto-refresh every 30 seconds
   */
  startAutoRefresh(): void {
    this.autoRefreshSubscription = interval(30000)
      .subscribe(() => {
        this.loadTables();
      });
  }

  /**
   * Get tables for selected section
   */
  getTablesForSelectedSection(): Table[] {
    let tables = this.allTables.filter((t) => t.sectionId === this.selectedSectionId);
    
    if (this.filterStatus) {
      tables = tables.filter((t) => t.status === this.filterStatus);
    }
    
    return tables;
  }

  /**
   * Select section tab
   */
  selectSection(sectionId: number): void {
    this.selectedSectionId = sectionId;
  }

  /**
   * Click table to book
   */
  async onTableClick(table: Table): Promise<void> {
    if (table.status === 'occupied') {
      Swal.fire({
        title: 'Table Occupied',
        text: `Table ${table.tableNumber} is currently occupied.`,
        icon: 'info',
        confirmButtonText: 'OK',
      });
      return;
    }

    if (table.status === 'reserved') {
      Swal.fire({
        title: 'Table Reserved',
        text: `Table ${table.tableNumber} is already reserved.`,
        icon: 'info',
        confirmButtonText: 'OK',
      });
      return;
    }

    // Show booking modal
    const result = await Swal.fire({
      title: `Book Table ${table.tableNumber}`,
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Customer Phone</label>
            <input id="customerPhone" type="text" class="swal2-input" placeholder="Enter phone number" style="width: 100%; margin: 0;">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Guest Count</label>
            <input id="guestCount" type="number" class="swal2-input" value="${table.capacity}" min="1" max="${table.capacity}" style="width: 100%; margin: 0;">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Reservation Date</label>
            <input id="reservationDate" type="date" class="swal2-input" style="width: 100%; margin: 0;">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Reservation Time</label>
            <input id="reservationTime" type="time" class="swal2-input" style="width: 100%; margin: 0;">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Special Requests</label>
            <textarea id="specialRequests" class="swal2-textarea" placeholder="Any special requests?" style="width: 100%; margin: 0;"></textarea>
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Book Table',
      cancelButtonText: 'Cancel',
      confirmButtonColor: '#3B82F6',
      preConfirm: () => {
        const customerPhone = (document.getElementById('customerPhone') as HTMLInputElement).value;
        const guestCount = (document.getElementById('guestCount') as HTMLInputElement).value;
        const reservationDate = (document.getElementById('reservationDate') as HTMLInputElement).value;
        const reservationTime = (document.getElementById('reservationTime') as HTMLInputElement).value;
        const specialRequests = (document.getElementById('specialRequests') as HTMLTextAreaElement).value;

        if (!customerPhone || !guestCount || !reservationDate || !reservationTime) {
          Swal.showValidationMessage('Please fill in all required fields');
          return false;
        }

        return {
          customerPhone,
          guestCount: parseInt(guestCount),
          reservationDate,
          reservationTime,
          specialRequests,
        };
      },
    });

    if (result.isConfirmed && result.value) {
      this.bookTable(table, result.value);
    }
  }

  /**
   * Book table (create reservation)
   */
  bookTable(table: Table, formData: any): void {
    // Search for customer first
    this.http.get<any>(`http://localhost:8080/customers/search/phone/${formData.customerPhone}`)
      .subscribe({
        next: (customer) => {
          // Customer found, create reservation
          this.createReservation(table, customer, formData);
        },
        error: (error) => {
          if (error.status === 404) {
            // Customer not found, ask to create
            Swal.fire({
              title: 'Customer Not Found',
              text: 'Would you like to create a new customer?',
              icon: 'question',
              showCancelButton: true,
              confirmButtonText: 'Create Customer',
              cancelButtonText: 'Cancel',
            }).then((createResult) => {
              if (createResult.isConfirmed) {
                this.showCreateCustomerModal(table, formData);
              }
            });
          } else {
            this.showError('Error checking customer');
          }
        },
      });
  }

  /**
   * Show create customer modal
   */
  async showCreateCustomerModal(table: Table, reservationData: any): Promise<void> {
    const result = await Swal.fire({
      title: 'Create New Customer',
      html: `
        <div class="text-left space-y-4">
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
            <input id="firstName" type="text" class="swal2-input" style="width: 100%; margin: 0;">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
            <input id="lastName" type="text" class="swal2-input" style="width: 100%; margin: 0;">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input id="email" type="email" class="swal2-input" style="width: 100%; margin: 0;">
          </div>
          <div>
            <label class="block text-sm font-medium text-gray-700 mb-1">Phone *</label>
            <input id="phone" type="text" class="swal2-input" value="${reservationData.customerPhone}" style="width: 100%; margin: 0;">
          </div>
        </div>
      `,
      showCancelButton: true,
      confirmButtonText: 'Create & Book',
      cancelButtonText: 'Cancel',
      preConfirm: () => {
        const firstName = (document.getElementById('firstName') as HTMLInputElement).value;
        const lastName = (document.getElementById('lastName') as HTMLInputElement).value;
        const email = (document.getElementById('email') as HTMLInputElement).value;
        const phone = (document.getElementById('phone') as HTMLInputElement).value;

        if (!firstName || !lastName || !phone) {
          Swal.showValidationMessage('Please fill in all required fields');
          return false;
        }

        return { firstName, lastName, email, phone };
      },
    });

    if (result.isConfirmed && result.value) {
      // Create customer then reservation
      this.http.post<any>('http://localhost:8080/api/customer/save', result.value)
        .subscribe({
          next: (customer) => {
            this.createReservation(table, customer, reservationData);
          },
          error: () => {
            this.showError('Failed to create customer');
          },
        });
    }
  }

  /**
   * Create reservation
   */
  createReservation(table: Table, customer: any, formData: any): void {
    const reservationPayload = {
      customerId: customer.id,
      tableId: table.id,
      reservationDate: formData.reservationDate,
      reservationTime: formData.reservationTime,
      guestCount: formData.guestCount,
      specialRequests: formData.specialRequests || '',
      status: 'confirmed',
    };

    this.http.post('http://localhost:8080/api/reservations', reservationPayload)
      .subscribe({
        next: () => {
          Swal.fire({
            title: 'Success!',
            text: `Table ${table.tableNumber} has been booked successfully.`,
            icon: 'success',
            confirmButtonText: 'OK',
          });
          // Refresh layout to see updated status
          this.loadTables();
        },
        error: () => {
          this.showError('Failed to create reservation');
        },
      });
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
}
