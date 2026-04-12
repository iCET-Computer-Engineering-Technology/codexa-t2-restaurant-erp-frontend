import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CategoryModel, PortionsModel } from '../../../model/type';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menu-categories',
  imports: [ReactiveFormsModule, FormsModule, CommonModule],
  templateUrl: './menu-categories.html',
  styleUrl: './menu-categories.css',
})
export class MenuCategories implements OnInit {
  
  isEditMode: boolean = false;
  

  categoryList : Array<CategoryModel> = [];
  porttionList : Array<PortionsModel> = [];
  categoryObj : CategoryModel = {
    id : 0,
    name : '',
    isActive : true
  }

  constructor(private readonly http : HttpClient , private readonly cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.getAll();
  }
  

  getAll(){
    this.http.get<CategoryModel[]>("http://localhost:8080/api/categories/get-all").subscribe(data => {
      this.categoryList = data;
      this.cdr.detectChanges();
    })
  }

  addCategory() : void {
    this.http.post("http://localhost:8080/api/categories" , this.categoryObj).subscribe(data => {
      this.getAll();
    })
  }

  clearForm(): void {
    this.categoryObj = { 
      id: 0, 
      name: '', 
      isActive: true 
    };
  }

  onEdit(category: CategoryModel): void {
  this.categoryObj = { ...category }; 
  this.isEditMode = true; 
}

updateCategory() : void {
  this.http.put("http://localhost:8080/api/categories" , this.categoryObj).subscribe(data => {
    this.getAll();
    this.clearForm();
    this.isEditMode = false;
  })
}

deleteMenuCategory(id: number): void {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626", 
      cancelButtonColor: "#6b7280", 
      confirmButtonText: "Yes, delete it!"
    }).then((result: any) => {
      
      if (result.isConfirmed) {
        this.http.delete(`http://localhost:8080/api/categories/${id}`).subscribe({
          next: (data) => {
            
            Swal.fire({
              title: "Deleted!",
              text: "The item has been deleted.",
              icon: "success"
            });
            this.getAll();
          },
          error: (err) => {
            console.error("Delete failed:", err);
            Swal.fire("Error", "Could not delete the item.", "error");
          }
        });
      }
    });
  }
}


