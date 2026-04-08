import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Supplier } from '../models/supplier.model';

@Injectable({
  providedIn: 'root'
})
export class SupplierService {

  private readonly BASE_URL = 'http://localhost:8080/api/supplier';

  constructor(private http: HttpClient) {}

  getAllSuppliers(): Observable<Supplier[]> {
    return this.http.get<Supplier[]>(`${this.BASE_URL}/get-all`);
  }

  saveSupplier(supplier: Supplier): Observable<Supplier> {
    return this.http.post<Supplier>(`${this.BASE_URL}/save`, supplier);
  }

  updateSupplier(supplier: Supplier): Observable<Supplier> {
    return this.http.put<Supplier>(`${this.BASE_URL}/update`, supplier);
  }

  deleteSupplier(id: number): Observable<boolean> {
    return this.http.delete<boolean>(`${this.BASE_URL}/delete/${id}`);
  }
}
