export interface LowStockAlert {
  id?: number;
  ingredientId: number;
  ingredientName?: string;
  currentStock?: number;
  lowStockThreshold?: number;
  reorderQuantity?: number;
  unit?: string;
  alertDate?: string;
  status?: string;
}

export interface LowStockThresholdRequest {
  lowStockThreshold: number;
  reorderQuantity?: number;
}
