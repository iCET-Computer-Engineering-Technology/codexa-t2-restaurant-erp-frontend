import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { MenuItemsModel } from '../../../model/type';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menu-items',
  imports: [FormsModule, CommonModule],
  templateUrl: './menu-items.html',
  styleUrl: './menu-items.css',
})
export class MenuItems {

  isEditMode : boolean = false;

  menuItemList: Array<MenuItemsModel> = [];
  menuItemObj: MenuItemsModel = {
    id: 0,
    name: '',
    categoryId: 0,
    description: '',
    isAvailable: true,
    imageUrl: ''

  }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.getAll();
  }

  getAll() {
    this.http.get<MenuItemsModel[]>("http://localhost:8080/menu-items").subscribe(data => {
      this.menuItemList = data;
      this.cdr.detectChanges();
    })
  }

  addMenuItem(): void {
    this.http.post("http://localhost:8080/menu-items", this.menuItemObj).subscribe(data => {
      this.getAll();
    })
  }

  clearForm(): void {
    this.menuItemObj = {
      id: 0,
      name: '',
      categoryId: 0,
      description: '',
      isAvailable: true,
      imageUrl: ''
    }
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
