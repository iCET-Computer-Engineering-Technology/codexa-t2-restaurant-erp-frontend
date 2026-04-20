
export interface ReceiptDTO {
  orderId: number;
  orderNumber: string;
  orderType: string;
  tableId?: number;
  status: string;
  notes?: string;
  customerId?: number;
  customerName?: string;
  customerEmail?: string;
  customerPhone?: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  totalAmount: number;
  items: ReceiptItemDTO[];
  paymentMethod: string;
  paymentAmount: number;
  tipAmount: number;
  referenceNumber?: string;
  // Audit Trail (Who & When)
  processedBy?: string;
  processedAt: string | Date;
  // Timestamps
  createdAt: string | Date;
}

export interface ReceiptItemDTO {
  id: number;
  itemName: string;
  portionName: string;
  quantity: number;
  price: number;
  lineTotal: number;
  notes?: string;
}


//Frontend display model for receipt row in table
export interface ReceiptRow {
  receiptId: number;
  orderNumber: string;
  orderType: string;
  tableId?: number;
  amount: number;
  date: Date;
  paymentMethod: string;
  processedBy?: string;
  processedAt: Date;
}

//Filter parameters for receipt search
export interface ReceiptFilterParams {
  orderNumber?: string;
  startDate?: Date;
  endDate?: Date;
}

//Pagination
export interface PaginationInfo {
  currentPage: number;
  itemsPerPage: number;
  totalItems: number;
  totalPages: number;
}

//View state for the receipts component
export type ReceiptViewMode = 'list' | 'detail';

//Order types for badge display
export type OrderType = 'dine-in' | 'takeaway' | 'booking';

//Payment methods
export type PaymentMethod = 'cash' | 'card';

//Financial breakdown helper
export interface FinancialBreakdown {
  subTotal: number;
  discount: number;
  subtotalAfterDiscount: number;
  tax: number;
  serviceCharge: number;
  total: number;
  paid: number;
  tip: number;
  change: number;
}

export function calculateFinancialBreakdown(receipt: ReceiptDTO): FinancialBreakdown {
  const subtotalAfterDiscount = receipt.subTotal - receipt.discountAmount;
  const total = subtotalAfterDiscount + receipt.taxAmount + receipt.serviceCharge;
  const paid = receipt.paymentAmount + (receipt.tipAmount || 0);
  const change = Math.max(0, paid - total);

  return {
    subTotal: receipt.subTotal,
    discount: receipt.discountAmount,
    subtotalAfterDiscount,
    tax: receipt.taxAmount,
    serviceCharge: receipt.serviceCharge,
    total,
    paid,
    tip: receipt.tipAmount || 0,
    change,
  };
}


export function formatCurrency(value: number): string {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'LKR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(value);
}

export function formatReceiptDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

export function getOrderToPaymentDuration(
  createdAt: string | Date,
  processedAt: string | Date
): string {
  const created = typeof createdAt === 'string' ? new Date(createdAt) : createdAt;
  const processed = typeof processedAt === 'string' ? new Date(processedAt) : processedAt;

  const diffMs = processed.getTime() - created.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'Just now';
  if (diffMins === 1) return '1 minute';
  if (diffMins < 60) return `${diffMins} minutes`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return '1 hour';
  return `${diffHours} hours`;
}
