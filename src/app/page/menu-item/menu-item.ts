import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MenuItemsModel } from '../../../model/type';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menu-items',
  imports: [FormsModule, CommonModule],
  templateUrl: './menu-item.html',
  styleUrl: './menu-item.css',
})
export class MenuItem implements OnInit {

  isEditMode : boolean = false;

  menuItemList: Array<MenuItemsModel> = [];
  categoryList: any[] = [];
  
  
  currentPage: number = 1;
  itemsPerPage: number = 5; // Change this to 10 if you want more rows!

  menuItemObj: MenuItemsModel = {
    id: 0,
    name: '',
    categoryId: 0,
    categoryName: '',
    description: '',
    isAvailable: true,
    imageUrl: ''
  }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.getAll();
    this.loadCategories();
  }

  loadCategories() {
    this.http.get<any[]>("http://localhost:8080/categories").subscribe(data => {
      this.categoryList = data;
    });
  }

  getAll() {
    this.http.get<MenuItemsModel[]>("http://localhost:8080/menu-items").subscribe(data => {
      
      this.menuItemList = data.sort((a, b) => Number(b.isAvailable) - Number(a.isAvailable));
      this.cdr.detectChanges();
    })
  }

 
  get paginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.menuItemList.slice(start, start + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.menuItemList.length / this.itemsPerPage);
  }

  getPagesArray() {
    return Array(this.totalPages).fill(0).map((x, i) => i + 1);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }
  

  addMenuItem(): void {
    this.http.post("http://localhost:8080/menu-items", this.menuItemObj).subscribe(data => {
      this.getAll();
      this.clearForm();
    })
  }

  clearForm(): void {
    this.menuItemObj = {
      id: 0,
      name: '',
      categoryId: 0,
      categoryName: '',
      description: '',
      isAvailable: true,
      imageUrl: ''
    }
    this.isEditMode = false;
  }

  onEdit(menuItem : MenuItemsModel) : void {
    this.menuItemObj = { ...menuItem }; 
    this.isEditMode = true; 
  }

  updateMenuItem() : void {
    this.http.put("http://localhost:8080/menu-items" , this.menuItemObj).subscribe(data => {
      this.getAll();
      this.clearForm();
      this.isEditMode = false;
    })
  }

  deleteMenuItem(id: number): void {
    Swal.fire({
      title: "Are you sure?",
      text: "You won't be able to revert this!",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc2626", 
      cancelButtonColor: "#6b7280", 
      confirmButtonText: "Yes, delete it!"
    }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete(`http://localhost:8080/menu-items/${id}`).subscribe({
          next: (data) => {
            Swal.fire("Deleted!", "The item has been deleted.", "success");
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