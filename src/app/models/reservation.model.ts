export interface ReservationModel {
  id?: number;
  customerId: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  tableId?: number;
  tableName?: string;
  reservationDate: string;
  reservationTime: string;
  guestCount: number;
  specialRequests?: string;
  status?: string;
  bookingReference?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface AvailableSlot {
  time: string;
  availableTables: number;
}

export interface TableAvailability {
  date: string;
  availableSlots: AvailableSlot[];
}

export interface ReservationResponse {
  id: number;
  bookingReference: string;
  status: string;
  message: string;
}
