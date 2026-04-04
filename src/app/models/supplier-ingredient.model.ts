export interface SupplierWithIngredientsDto {
  supplierId: number;
  supplierName: string;
  ingredients: IngredientDto[];
}

export interface IngredientDto {
  ingredientId: number;
  ingredientName: string;
  supplierSku: string;
  unitPrice: number;
  minOrderQty: number;
  priceDate: string;
}
