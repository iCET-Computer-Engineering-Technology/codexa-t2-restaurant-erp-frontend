import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { SupplierIngredientService } from '../../services/supplier-ingredient.service';
import { SupplierWithIngredientsDto, IngredientDto } from '../../models/supplier-ingredient.model';

@Component({
  selector: 'app-supplier-ingredient',
  imports: [CommonModule],
  templateUrl: './supplier-ingredient.html',
  styleUrl: './supplier-ingredient.css',
})
export class SupplierIngredient implements OnInit{

  suppliersWithIngredients: SupplierWithIngredientsDto[] = [];
  displayedColumns: string[] = ['ingredientName', 'unit', 'price'];

  constructor(private service: SupplierIngredientService) { }

  ngOnInit(): void {
    this.loadAllSuppliers();
  }

  loadAllSuppliers(): void {
    this.service.getAllSuppliersWithIngredients().subscribe({
      next: (data: SupplierWithIngredientsDto[]) => {
        this.suppliersWithIngredients = data;
      },
      error: (err: any) => {
        console.error('Error loading suppliers', err);
        alert('Error loading data from backend!');
      }
    });
  }

  viewSupplierDetails(supplierId: number): void {
    this.service.getIngredientsBySupplier(supplierId).subscribe((data: IngredientDto[]) => {
      console.log('Ingredients for supplier:', data);
    });
  }
}