import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { MenuItemPriceModel } from '../../../model/type';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menu-item-price',
  imports: [FormsModule, CommonModule],
  templateUrl: './menu-item-price.html',
  styleUrl: './menu-item-price.css',
})
export class MenuItemPrice {

  isEditMode : boolean = false;

  menuItemPriceList: Array<MenuItemPriceModel> = [];
  menuItemPriceObj: MenuItemPriceModel = {
    id: 0,
    itemId: 0,
    portionId: 0,
    price: 0.0,
    isActive: true
  }

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.getAll();
  }

  getAll() {
    this.http.get<MenuItemPriceModel[]>("http://localhost:8080/menu-item-price").subscribe(data => {
      this.menuItemPriceList = data;
      this.cdr.detectChanges();
    })
  }

  addMenuItemPrice(): void {
    this.http.post("http://localhost:8080/menu-item-price", this.menuItemPriceObj).subscribe(data => {
      this.getAll();
    })
  }

  clearForm(): void {
    this.menuItemPriceObj = {
      id: 0,
      itemId: 0,
      portionId: 0,
      price: 0.0,
      isActive: true
    }
  }

  onEdit(menuItemPrice: MenuItemPriceModel): void {
    this.menuItemPriceObj = { ...menuItemPrice }; 
    this.isEditMode = true; 
  }
  
  updateMenuItemPrice() : void {
    this.http.put("http://localhost:8080/menu-item-price" , this.menuItemPriceObj).subscribe(data => {
      this.getAll();
      this.clearForm();
      this.isEditMode = false;
    })
  }

deleteMenuItemPrice(id: number): void {
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
        this.http.delete(`http://localhost:8080/menu-item-price/${id}`).subscribe({
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