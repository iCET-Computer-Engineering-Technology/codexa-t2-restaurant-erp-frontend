export interface OrderWithItemNameResponse {
  id: number;
  orderTypeId?: number;
  orderNumber: string;
  orderType: string;
  tableId?: number;
  customerId?: number;
  serverId?: number;
  status: string;
  subTotal: number;
  discountAmount: number;
  taxAmount: number;
  serviceCharge: number;
  totalAmount: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
  items: OrderItemWithName[];
}

export interface OrderItemWithName {
  id: number;
  menuItemId: number;
  menuItemName: string;
  portionId: number;
  portionName: string;
  quantity: number;
  price: number;
  lineTotal?: number;
  status?: string;
  notes?: string;
}

export type OrderStatus = 
  | 'open'
  | 'sent_to_kitchen'
  | 'partially_ready'
  | 'ready'
  | 'paid'
  | 'voided';

export interface OrderStatusFilter {
  label: string;
  value: OrderStatus | 'all';
  color: string;
}
