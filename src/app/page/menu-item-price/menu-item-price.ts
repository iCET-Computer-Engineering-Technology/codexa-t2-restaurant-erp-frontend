import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MenuItemPriceModel, PortionsModel } from '../../../model/type';
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
  itemList: any[] = [];
  portionList: Array<PortionsModel> = [];
  
  
  currentPage: number = 1;
  itemsPerPage: number = 5; 

  menuItemPriceObj: MenuItemPriceModel = {
    id: 0,
    itemName: '',
    portionName: '',
    price: 0.0,
    isActive: true,
    itemId: 0,
    portionId: 0
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit(): void {
    this.getAll();
    this.loadDropdownData();
  }

  loadDropdownData(): void {
    this.http.get<any[]>("http://localhost:8080/menu-items").subscribe(data => {
      this.itemList = data;
    });

    this.http.get<any[]>("http://localhost:8080/portions").subscribe(data => {
      this.portionList = data;
    });
  }

  getAll() {
    this.http.get<MenuItemPriceModel[]>("http://localhost:8080/menu-item-price/get-full-menu").subscribe(data => {
      this.menuItemPriceList = data.sort((a, b) => Number(b.isActive) - Number(a.isActive));
      this.cdr.detectChanges();
    });
  }

  get paginatedData() {
    const start = (this.currentPage - 1) * this.itemsPerPage;
    return this.menuItemPriceList.slice(start, start + this.itemsPerPage);
  }

  get totalPages() {
    return Math.ceil(this.menuItemPriceList.length / this.itemsPerPage);
  }

  getPagesArray() {
    return Array(this.totalPages).fill(0).map((x, i) => i + 1);
  }

  changePage(page: number) {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  addMenuItemPrice(): void {
    this.http.post("http://localhost:8080/menu-item-price", this.menuItemPriceObj).subscribe(data => {
      this.getAll();
      this.clearForm(); 
    });
  }

  clearForm(): void {
    this.menuItemPriceObj = {
      id: 0,
      itemName: '',
      portionName: '',
      price: 0.0,
      isActive: true,
      itemId: 0,
      portionId: 0
    };
    this.isEditMode = false;
  }

  onEdit(menuItemPrice: MenuItemPriceModel): void {
    this.menuItemPriceObj = { ...menuItemPrice };
    this.isEditMode = true;
  }

  updateMenuItemPrice(): void {
    this.http.put("http://localhost:8080/menu-item-price", this.menuItemPriceObj).subscribe(data => {
      this.getAll();
      this.clearForm();
    });
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
            Swal.fire("Deleted!", "The price has been deleted.", "success");
            this.getAll();
          },
          error: (err) => {
            console.error("Delete failed:", err);
            Swal.fire("Error", "Could not delete the price.", "error");
          }
        });
      }
    });
  }
}