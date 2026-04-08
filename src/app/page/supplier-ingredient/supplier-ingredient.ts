import { CommonModule } from '@angular/common';
import { HttpClientModule, HttpClient } from '@angular/common/http';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-supplier-ingredient',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './supplier-ingredient.html',
  styleUrl: './supplier-ingredient.css',
})
export class SupplierIngredient implements OnInit, OnDestroy {
  supplierList: any[] = [];
  allSuppliers: any[] = [];
  searchText: string = '';
  private apiUrl = 'http://localhost:8080/supplier-ingredient';
  private destroy$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadSuppliers(): void {
    this.http.get<any[]>(this.apiUrl)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any[]) => {
          this.supplierList = data;
          this.allSuppliers = [...data];
        },
        error: (err) => {
          console.error('Error loading suppliers', err);
        }
      });
  }

  onSearch(): void {
    const text = this.searchText.toLowerCase();
    if (text === '') {
      this.supplierList = [...this.allSuppliers];
      return;
    }
    this.supplierList = this.allSuppliers.filter(supplier =>
      (supplier.supplierName && supplier.supplierName.toLowerCase().includes(text))
    );
  }
}
