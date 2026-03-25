import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
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
export class MenuItemPrice implements OnInit {

  isEditMode: boolean = false;

  menuItemPriceList: Array<MenuItemPriceModel> = [];
  menuItemPriceObj: MenuItemPriceModel = {
    id: 0,
    itemName: '',
    portionName: '',
    price: 0,
    isActive: true
  }

  constructor(private readonly http: HttpClient, private readonly cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.getAll();
  }

  getAll() {
    this.http.get<MenuItemPriceModel[]>("http://localhost:8080/api/menu-item-price/get-full-menu").subscribe(data => {
      this.menuItemPriceList = data;
      this.cdr.detectChanges();
    })
  }

  addMenuItemPrice(): void {
    this.http.post("http://localhost:8080/api/menu-item-price", this.menuItemPriceObj).subscribe(data => {
      this.getAll();
    })
  }

  clearForm(): void {
    this.menuItemPriceObj = {
      id: 0,
      itemName: '',
      portionName: '',
      price: 0,
      isActive: true
    }
  }

  onEdit(menuItemPrice: MenuItemPriceModel): void {
    this.menuItemPriceObj = { ...menuItemPrice };
    this.isEditMode = true;
  }

  updateMenuItemPrice(): void {
    this.http.put("http://localhost:8080/api/menu-item-price", this.menuItemPriceObj).subscribe(data => {
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
        this.http.delete(`http://localhost:8080/api/menu-item-price/${id}`).subscribe({
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