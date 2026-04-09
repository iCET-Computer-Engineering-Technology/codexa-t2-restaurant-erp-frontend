export interface PaymentDto {
  id?: number;
  orderId: number;
  paymentMethod: string;
  amount: number;
  tipAmount?: number;
  referenceNumber?: string;
  processedBy?: number;
  processedAt?: string;
}

export interface PaymentRow {
  method: 'cash' | 'card';
  amount: number;
  referenceNumber?: string;
}

export type PaymentMethod = 'cash' | 'card' | 'mixed';
