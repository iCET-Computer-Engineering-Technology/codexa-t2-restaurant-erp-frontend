import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import Swal from 'sweetalert2';
import { ReservationModel, AvailableSlot, ReservationResponse } from '../../models/reservation.model';

@Component({
  selector: 'app-reservations',
  imports: [CommonModule, FormsModule],
  templateUrl: './reservations.html',
  styleUrl: './reservations.css',
})
export class ReservationsComponent implements OnInit {
  // Form Control
  currentStep: number = 1;
  isEditMode: boolean = false;

  // Form Data
  reservationForm: ReservationModel = {
    customerId: 0,
    customerName: '',
    customerEmail: '',
    customerPhone: '',
    reservationDate: '',
    reservationTime: '',
    guestCount: 2,
    specialRequests: '',
    status: 'pending',
  };

  // Lists
  allReservations: ReservationModel[] = [];
  filteredReservations: ReservationModel[] = [];
  availableSlots: AvailableSlot[] = [];

  // Filter
  filterStatus: string = '';

  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 7;

  // UI State
  successMessage: string = '';
  errorMessage: string = '';
  showDetailModal: boolean = false;
  showStatusUpdateModal: boolean = false;
  selectedReservation: ReservationModel | null = null;
  selectedStatusForUpdate: string = '';

  private readonly apiBaseUrl = 'http://localhost:8080';

  constructor(
    private readonly http: HttpClient,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadAllReservations();
  }

  /**
   * Load all reservations for the current customer
   */
  loadAllReservations(): void {
    // Get upcoming reservations
    this.http
      .get<unknown>(`${this.apiBaseUrl}/api/reservations/upcoming`)
      .subscribe({
        next: (data) => {
          console.log('API Response from /api/reservations/upcoming:', data);
          this.allReservations = this.extractReservationArray(data).map((item) =>
            this.normalizeReservation(item)
          );
          this.filterReservations();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error loading reservations:', error);
          this.showError('Failed to load reservations');
        },
      });
  }

  /**
   * Filter reservations based on status
   */
  filterReservations(): void {
    if (this.filterStatus === '') {
      this.filteredReservations = [...this.allReservations];
    } else {
      this.filteredReservations = this.allReservations.filter(
        (r) => r.status?.toLowerCase() === this.filterStatus.toLowerCase()
      );
    }
    this.currentPage = 1; // Reset to first page when filtering
    this.cdr.detectChanges();
  }

  /**
   * Get paginated reservations
   */
  getPaginatedReservations(): ReservationModel[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredReservations.slice(startIndex, endIndex);
  }

  /**
   * Get total number of pages
   */
  getTotalPages(): number {
    return Math.ceil(this.filteredReservations.length / this.itemsPerPage);
  }

  /**
   * Go to next page
   */
  nextPage(): void {
    if (this.currentPage < this.getTotalPages()) {
      this.currentPage++;
      this.cdr.detectChanges();
    }
  }

  /**
   * Go to previous page
   */
  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.cdr.detectChanges();
    }
  }

  /**
   * Convert 24-hour time to 12-hour format
   */
  convertTo12HourFormat(time: string): string {
    if (!time) return '';
    const [hours, minutes] = time.split(':');
    const hour = Number.parseInt(hours, 10);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour % 12 || 12;
    return `${displayHour}:${minutes} ${ampm}`;
  }

  /**
   * Get minimum date for reservation (today)
   */
  getMinDate(): string {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  /**
   * Handle date selection - fetch available slots
   */
  onDateSelected(): void {
    if (!this.reservationForm.reservationDate) {
      this.availableSlots = [];
      return;
    }

    console.log('Date selected:', this.reservationForm.reservationDate, 'Guest count:', this.reservationForm.guestCount);

    this.http
      .get<any>(
        `${this.apiBaseUrl}/api/reservations/available-slots?date=${this.reservationForm.reservationDate}&partySize=${this.reservationForm.guestCount}`
      )
      .subscribe({
        next: (response) => {
          console.log('Available slots response:', response);

          // Handle different response formats
          let slots: AvailableSlot[] = [];

          if (Array.isArray(response)) {
            slots = response;
          } else if (Array.isArray(response?.availableSlots)) {
            slots = response.availableSlots;
          } else if (Array.isArray(response?.data)) {
            slots = response.data;
          } else if (Array.isArray(response?.content)) {
            slots = response.content;
          }

          this.availableSlots = slots;
          console.log('Final availableSlots:', this.availableSlots);
          this.reservationForm.reservationTime = '';
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error fetching available slots:', error);
          console.error('Status:', error.status);
          console.error('Message:', error.message);
          this.availableSlots = [];
          this.showError('Failed to fetch available slots: ' + (error.error?.message || error.message));
        },
      });
  }

  /**
   * Select a time slot
   */
  selectTime(time: string): void {
    this.reservationForm.reservationTime = time;
    this.cdr.detectChanges();
  }

  /**
   * Increase guest count
   */
  increaseGuestCount(): void {
    if (this.reservationForm.guestCount < 20) {
      this.reservationForm.guestCount++;
      this.onDateSelected();
      this.cdr.detectChanges();
    }
  }

  /**
   * Decrease guest count
   */
  decreaseGuestCount(): void {
    if (this.reservationForm.guestCount > 1) {
      this.reservationForm.guestCount--;
      this.onDateSelected();
      this.cdr.detectChanges();
    }
  }

  /**
   * Validate current step
   */
  isStepValid(): boolean {
    switch (this.currentStep) {
      case 1:
        return !!(this.reservationForm.reservationDate && this.reservationForm.reservationTime);
      case 2:
        return !!(this.reservationForm.guestCount && this.reservationForm.reservationTime);
      case 3:
        return !!(
          this.reservationForm.customerName &&
          this.reservationForm.customerEmail &&
          this.reservationForm.customerPhone
        );
      case 4:
        return true;
      default:
        return false;
    }
  }

  /**
   * Move to next step
   */
  nextStep(): void {
    if (this.isStepValid() && this.currentStep < 4) {
      this.currentStep++;
      this.cdr.detectChanges();
    }
  }

  /**
   * Move to previous step
   */
  previousStep(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.cdr.detectChanges();
    }
  }

  /**
   * Submit reservation
   */
  submitReservation(): void {
    if (!this.isStepValid()) {
      this.showError('Please complete all required fields');
      return;
    }

    const reservation = {
      customerId: this.reservationForm.customerId || 0,
      customerName: this.reservationForm.customerName,
      customerEmail: this.reservationForm.customerEmail,
      customerPhone: this.reservationForm.customerPhone,
      reservationDate: this.reservationForm.reservationDate,
      reservationTime: this.reservationForm.reservationTime,
      guestCount: this.reservationForm.guestCount,
      specialRequests: this.reservationForm.specialRequests,
      tableName: this.reservationForm.tableName,
    };

    console.log('Submitting reservation:', reservation);

    this.http
      .post<ReservationResponse>(`${this.apiBaseUrl}/api/reservations/book`, reservation)
      .subscribe({
        next: (response) => {
          console.log('Reservation response:', response);
          this.showSuccess(
            `Booking confirmed! Your reference: ${response.bookingReference}`
          );

          // Add the new reservation to the list immediately
          const newReservation: ReservationModel = {
            id: response.id || 0,
            bookingReference: response.bookingReference,
            customerId: this.reservationForm.customerId,
            customerName: this.reservationForm.customerName,
            customerEmail: this.reservationForm.customerEmail,
            customerPhone: this.reservationForm.customerPhone,
            reservationDate: this.reservationForm.reservationDate,
            reservationTime: this.reservationForm.reservationTime,
            guestCount: this.reservationForm.guestCount,
            specialRequests: this.reservationForm.specialRequests,
            status: 'confirmed',
            tableName: this.reservationForm.tableName,
          };

          this.allReservations.unshift(newReservation); // Add to beginning
          this.filterReservations(); // Update filtered list
          this.resetForm();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error submitting reservation:', error);
          this.showError(
            error.error?.message || 'Failed to submit reservation. Please try again.'
          );
        },
      });
  }

  /**
   * View reservation details
   */
  viewReservation(reservation: ReservationModel): void {
    console.log('Viewing reservation:', reservation);
    const normalizedReservation = this.normalizeReservation(reservation);

    this.selectedReservation = {
      ...normalizedReservation,
      bookingReference: normalizedReservation.bookingReference || 'N/A',
      customerName: normalizedReservation.customerName || 'N/A',
      customerEmail: normalizedReservation.customerEmail || 'N/A',
      customerPhone: normalizedReservation.customerPhone || 'N/A',
      guestCount: normalizedReservation.guestCount || 0,
    };

    this.showDetailModal = true;
    this.cdr.detectChanges();

    // Some list APIs return partial rows; fetch by id to hydrate missing modal fields.
    if (normalizedReservation.id && this.hasMissingDetailFields(normalizedReservation)) {
      this.http
        .get<unknown>(`${this.apiBaseUrl}/api/reservations/${normalizedReservation.id}`)
        .subscribe({
          next: (detailPayload) => {
            if (!this.showDetailModal || !this.selectedReservation) {
              return;
            }

            const detail = this.normalizeReservation(this.extractReservationItem(detailPayload));
            this.selectedReservation = {
              ...this.selectedReservation,
              ...detail,
              bookingReference: detail.bookingReference || this.selectedReservation.bookingReference || 'N/A',
              customerName: detail.customerName || this.selectedReservation.customerName || 'N/A',
              customerEmail: detail.customerEmail || this.selectedReservation.customerEmail || 'N/A',
              customerPhone: detail.customerPhone || this.selectedReservation.customerPhone || 'N/A',
              guestCount: detail.guestCount || this.selectedReservation.guestCount || 0,
            };
            this.cdr.detectChanges();
          },
          error: (error) => {
            console.warn('Reservation detail hydration failed, using list row data:', error);
          },
        });
    }
  }

  /**
   * Close detail modal
   */
  closeDetailModal(): void {
    this.showDetailModal = false;
    this.selectedReservation = null;
    this.cdr.detectChanges();
  }

  /**
   * Cancel reservation
   */
  cancelReservation(reservationId: number): void {
    Swal.fire({
      title: 'Cancel Reservation?',
      text: 'Are you sure you want to cancel this reservation?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444',
      cancelButtonColor: '#94a3b8',
      confirmButtonText: 'Yes, cancel it',
    }).then((result) => {
      if (result.isConfirmed) {
        this.confirmCancelReservation(reservationId);
      }
    });
  }

  /**
   * Open status update dialog
   */
  openStatusUpdateModal(reservation: ReservationModel): void {
    this.selectedReservation = this.normalizeReservation(reservation);
    this.selectedStatusForUpdate = reservation.status || 'confirmed';
    this.showStatusUpdateModal = true;
    this.cdr.detectChanges();
  }

  /**
   * Close status update modal
   */
  closeStatusUpdateModal(): void {
    this.showStatusUpdateModal = false;
    this.selectedStatusForUpdate = '';
    this.cdr.detectChanges();
  }

  /**
   * Update reservation status
   */
  updateReservationStatus(): void {
    if (!this.selectedReservation?.id) {
      this.showError('Invalid reservation');
      return;
    }

    const updatePayload = {
      status: this.selectedStatusForUpdate,
    };

    this.http
      .patch<{ message: string }>(
        `${this.apiBaseUrl}/api/reservations/${this.selectedReservation.id}/status`,
        updatePayload
      )
      .subscribe({
        next: () => {
          this.showSuccess(`Reservation status updated to ${this.selectedStatusForUpdate}`);

          // Update the reservation in the list
          const reservation = this.allReservations.find(r => r.id === this.selectedReservation?.id);
          if (reservation) {
            reservation.status = this.selectedStatusForUpdate;
          }

          this.filterReservations();
          this.closeStatusUpdateModal();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error updating status:', error);
          this.showError('Failed to update reservation status');
        },
      });
  }

  /**
   * Confirm cancel reservation via API
   */
  confirmCancelReservation(reservationId: number): void {
    this.http
      .delete<{ message: string }>(
        `${this.apiBaseUrl}/api/reservations/${reservationId}`
      )
      .subscribe({
        next: () => {
          this.showSuccess('Reservation cancelled successfully');
          this.closeDetailModal();
          this.allReservations = this.allReservations.filter(r => r.id !== reservationId);
          this.filterReservations();
          this.cdr.detectChanges();
        },
        error: (error) => {
          console.error('Error cancelling reservation:', error);
          this.showError('Failed to cancel reservation');
        },
      });
  }

  /**
   * Reset form to initial state
   */
  resetForm(): void {
    this.reservationForm = {
      customerId: 0,
      customerName: '',
      customerEmail: '',
      customerPhone: '',
      reservationDate: '',
      reservationTime: '',
      guestCount: 2,
      specialRequests: '',
      status: 'pending',
    };
    this.currentStep = 1;
    this.availableSlots = [];
    this.isEditMode = false;
    this.cdr.detectChanges();
  }

  /**
   * Extract reservation array from various possible payload structures
   */
  private extractReservationArray(payload: unknown): unknown[] {
    if (Array.isArray(payload)) {
      return payload;
    }

    if (payload && typeof payload === 'object') {
      const wrapped = payload as {
        data?: unknown[];
        content?: unknown[];
        reservations?: unknown[];
        items?: unknown[];
        result?: unknown[];
      };

      if (Array.isArray(wrapped.data)) return wrapped.data;
      if (Array.isArray(wrapped.content)) return wrapped.content;
      if (Array.isArray(wrapped.reservations)) return wrapped.reservations;
      if (Array.isArray(wrapped.items)) return wrapped.items;
      if (Array.isArray(wrapped.result)) return wrapped.result;
    }

    return [];
  }

  private extractReservationItem(payload: unknown): unknown {
    if (!payload || typeof payload !== 'object') {
      return payload;
    }

    const wrapped = payload as {
      data?: unknown;
      reservation?: unknown;
      item?: unknown;
      result?: unknown;
    };

    return wrapped.data ?? wrapped.reservation ?? wrapped.item ?? wrapped.result ?? payload;
  }

  private hasMissingDetailFields(reservation: ReservationModel): boolean {
    return (
      !reservation.customerName ||
      !reservation.customerEmail ||
      !reservation.customerPhone ||
      !reservation.guestCount
    );
  }

  /**
   * Normalize a raw reservation object to ensure consistent fields
   */
  private normalizeReservation(rawReservation: unknown): ReservationModel {
    const raw = (rawReservation ?? {}) as Record<string, unknown>;
    const customer = (
      (raw['customer'] as Record<string, unknown> | undefined) ??
      (raw['customerDetails'] as Record<string, unknown> | undefined) ??
      (raw['customerInfo'] as Record<string, unknown> | undefined) ??
      (raw['guest'] as Record<string, unknown> | undefined) ??
      (raw['guestDetails'] as Record<string, unknown> | undefined) ??
      (raw['user'] as Record<string, unknown> | undefined) ??
      {}
    );

    const guestCountRaw =
      raw['guestCount'] ??
      raw['guest_count'] ??
      raw['partySize'] ??
      raw['party_size'] ??
      raw['numberOfGuests'] ??
      raw['number_of_guests'] ??
      customer['guestCount'] ??
      customer['partySize'];

    return {
      id: this.toNumber(raw['id'] ?? raw['reservationId']),
      customerId: this.toNumber(raw['customerId'] ?? raw['customer_id'] ?? customer['id']),
      customerName: this.toText(
        raw['customerName'],
        raw['customer_name'],
        raw['name'],
        customer['customerName'],
        customer['name'],
        customer['fullName']
      ),
      customerEmail: this.toText(
        raw['customerEmail'],
        raw['customer_email'],
        raw['email'],
        customer['customerEmail'],
        customer['email']
      ),
      customerPhone: this.toText(
        raw['customerPhone'],
        raw['customer_phone'],
        raw['phone'],
        raw['mobile'],
        customer['customerPhone'],
        customer['phone'],
        customer['mobile']
      ),
      tableId: this.toNumber(raw['tableId'] ?? raw['table_id']),
      tableName: this.toText(raw['tableName'], raw['table_name']),
      reservationDate: this.toText(raw['reservationDate'], raw['reservation_date'], raw['date']),
      reservationTime: this.toText(raw['reservationTime'], raw['reservation_time'], raw['time']),
      guestCount: this.toNumber(guestCountRaw),
      specialRequests: this.toText(raw['specialRequests'], raw['special_requests'], raw['notes']),
      status: this.toText(raw['status'], raw['reservationStatus'], raw['reservation_status']) || 'pending',
      bookingReference: this.toText(raw['bookingReference'], raw['booking_reference'], raw['reference']),
      createdAt: this.toText(raw['createdAt'], raw['created_at']),
      updatedAt: this.toText(raw['updatedAt'], raw['updated_at']),
    };
  }

  private toText(...values: unknown[]): string {
    for (const value of values) {
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }

    return '';
  }

  private toNumber(value: unknown): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  /**
   * Show success message
   */
  private showSuccess(message: string): void {
    this.successMessage = message;
    this.errorMessage = '';
    setTimeout(() => {
      this.successMessage = '';
    }, 5000);
    this.cdr.detectChanges();
  }

  /**
   * Show error message
   */
  private showError(message: string): void {
    this.errorMessage = message;
    this.successMessage = '';
    setTimeout(() => {
      this.errorMessage = '';
    }, 5000);
    this.cdr.detectChanges();
  }

  /**
   * Clear messages
   */
  clearMessages(): void {
    this.successMessage = '';
    this.errorMessage = '';
    this.cdr.detectChanges();
  }
}
