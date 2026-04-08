
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { SupplierWithIngredientsDto } from '../models/supplier-ingredient.model';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupplierIngredientService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = environment.apiUrl.replace(/\/api\/?$/, ''); // http://localhost:8080
  private readonly apiUrl = `${this.baseUrl}/admin/supplier-ingredient`;

  getAllSuppliersWithIngredients(): Observable<SupplierWithIngredientsDto[]> {
    return this.http.get<SupplierWithIngredientsDto[]>(this.apiUrl);
  }

  searchIngredients(searchTerm: string): Observable<SupplierWithIngredientsDto[]> {
    return this.http.get<SupplierWithIngredientsDto[]>(this.apiUrl, {
      params: { query: searchTerm }
    });
  }
}
