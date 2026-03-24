export type OrderType = 'dine_in' | 'takeout' | 'delivery' | 'online';

export interface MenuCategoriesDto {
  id: number;
  name: string;
  isActive: boolean;
}

export interface MenuItemsDto {
  id: number;
  categoryId: number;
  categoryName?: string;
  name: string;
  description?: string;
  isAvailable?: boolean;
  imageUrl?: string;
  createdAt?: string;
  updatedAt?: string;
}

export interface MenuItemPriceDto {
  id: number;
  itemId: number;
  portionId: number;
  price: number;
  isActive: boolean;
  itemName?: string;
  categoryName?: string;
  portionName?: string;
}

export interface PortionDto {
  id: number;
  name: string;
  isActive: boolean;
}

export interface TableDto {
  id: number;
  tableNumber: string;
  capacity?: number;
  status?: string;
}

export interface CustomerDto {
  id: number;
  firstName: string;
  lastName: string;
  email?: string;
  phone: string;
  address?: string;
  preferredLanguage?: string;
  dietaryNotes?: string;
  communicationEmail?: number;
  communicationSms?: number;
  gdprDeleted?: number;
  birthday?: string;
  loyaltyPoints?: number;
  createdAt?: string;
}

export interface OrderItemCreateRequest {
  menuItemId: number;
  portionId: number;
  quantity: number;
  price: number;
  notes?: string;
}

export interface OrderCreateRequest {
  orderType: string;
  tableId?: number;
  customerId?: number;
  serverId?: number;
  notes?: string;
  items: OrderItemCreateRequest[];
}

export interface OrderItemResponse {
  id: number;
  orderId: number;
  menuItemId: number;
  portionId: number;
  quantity: number;
  price: number;
  lineTotal?: number;
  status?: string;
  notes?: string;
  createdAt?: string;
}

export interface OrderResponse {
  id: number;
  orderNumber: string;
  orderType: string;
  tableId?: number;
  customerId?: number;
  serverId?: number;
  status?: string;
  subTotal?: number;
  discountAmount?: number;
  taxAmount?: number;
  serviceCharge?: number;
  totalAmount?: number;
  notes?: string;
  createdAt?: string;
  updatedAt?: string;
  items?: OrderItemResponse[];
}

export interface OrderCartItem {
  menuItemId: number;
  menuItemName: string;
  portionId: number;
  portionName: string;
  price: number;
  quantity: number;
  notes?: string;
}
