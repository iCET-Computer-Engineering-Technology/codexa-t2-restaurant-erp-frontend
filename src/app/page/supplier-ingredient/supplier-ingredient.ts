import { CommonModule } from '@angular/common';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SupplierIngredientService } from '../../services/supplier-ingredient.service';
import { SupplierWithIngredientsDto, IngredientDto } from '../../models/supplier-ingredient.model';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-supplier-ingredient',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './supplier-ingredient.html',
  styleUrl: './supplier-ingredient.css',
})
export class SupplierIngredient implements OnInit, OnDestroy {
  inventoryItems: IngredientDto[] = [];
  allData: SupplierWithIngredientsDto[] = [];
  searchText: string = '';
  isLoading: boolean = false;
  error: string | null = null;
  
  private destroy$ = new Subject<void>();

  constructor(private service: SupplierIngredientService) { }

  ngOnInit(): void {
    this.loadAllIngredients();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadAllIngredients(): void {
    this.isLoading = true;
    this.service.getAllSuppliersWithIngredients()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.allData = data;
          this.inventoryItems = data.flatMap(supplier => supplier.ingredients);
          this.isLoading = false;
        },
        error: (err) => {
          console.error('Error loading ingredients', err);
          this.error = "Error occurred while fetching data.";
          this.isLoading = false;
        }
      });
  }

  onSearch(): void {
    const search = this.searchText.toLowerCase().trim();

    if (search === '') {
      this.inventoryItems = this.allData.flatMap(supplier => supplier.ingredients);
      return;
    }

    this.inventoryItems = this.allData.flatMap(supplier => 
      supplier.ingredients.filter((ing: IngredientDto) =>
        ing.ingredientName.toLowerCase().includes(search) ||
        ing.supplierSku?.toLowerCase().includes(search)
      )
    );
  }
}