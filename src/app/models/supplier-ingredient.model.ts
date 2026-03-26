export interface SupplierWithIngredientsDto {
  supplierId: number;
  supplierName: string;
  ingredients: IngredientDto[];
}

export interface IngredientDto {
  ingredientName: string;
  unit: string;
  price: number;
}
