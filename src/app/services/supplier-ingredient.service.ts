import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupplierWithIngredientsDto, IngredientDto } from '../models/supplier-ingredient.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierIngredientService {
  private base = 'http://localhost:8080/api/supplier-ingredients';

  constructor(private http: HttpClient) {}

  getAllSuppliersWithIngredients(): Observable<SupplierWithIngredientsDto[]> {
    return this.http.get<SupplierWithIngredientsDto[]>(`${this.base}/all`);
  }

  getIngredientsBySupplier(supplierId: number): Observable<IngredientDto[]> {
    return this.http.get<IngredientDto[]>(`${this.base}/${supplierId}`);
  }
}
