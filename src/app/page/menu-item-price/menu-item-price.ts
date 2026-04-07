import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { MenuItemPriceModel, MenuItemsModel, PortionsModel } from '../../../model/type';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-menu-item-price',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './menu-item-price.html',
  styleUrl: './menu-item-price.css',
})
export class MenuItemPrice implements OnInit {

  isEditMode: boolean = false;

  menuItemsList: Array<MenuItemsModel> = [];
  portionsList: Array<PortionsModel> = [];
  selectedItemId: number = 0;
  selectedPortionId: number = 0;

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
    this.getAllMenuItems();
    this.getAllPortions();
  }

  getAll() {
    this.http.get<MenuItemPriceModel[]>("http://localhost:8080/api/menu-item-price/get-full-menu").subscribe(data => {
      this.menuItemPriceList = data;
      this.cdr.detectChanges();
    })
  }

  getAllMenuItems() {
    this.http.get<MenuItemsModel[]>("http://localhost:8080/api/menu-items").subscribe(data => {
      this.menuItemsList = data;
      if (this.isEditMode) {
        this.syncSelectionsFromPayload();
      }
      this.cdr.detectChanges();
    })
  }

  getAllPortions() {
    this.http.get<PortionsModel[]>("http://localhost:8080/portions").subscribe(data => {
      this.portionsList = data;
      if (this.isEditMode) {
        this.syncSelectionsFromPayload();
      }
      this.cdr.detectChanges();
    })
  }

  private syncPayloadFromSelections(): void {
    this.menuItemPriceObj.itemName = this.selectedItemId ? String(this.selectedItemId) : '';
    this.menuItemPriceObj.portionName = this.selectedPortionId ? String(this.selectedPortionId) : '';
  }

  private syncSelectionsFromPayload(): void {
    const parsedItemId = Number(this.menuItemPriceObj.itemName);
    if (!Number.isNaN(parsedItemId) && parsedItemId > 0) {
      this.selectedItemId = parsedItemId;
    } else {
      const matchedItem = this.menuItemsList.find(
        (item) => item.name.toLowerCase() === String(this.menuItemPriceObj.itemName).toLowerCase()
      );
      this.selectedItemId = matchedItem ? matchedItem.id : 0;
    }

    const parsedPortionId = Number(this.menuItemPriceObj.portionName);
    if (!Number.isNaN(parsedPortionId) && parsedPortionId > 0) {
      this.selectedPortionId = parsedPortionId;
    } else {
      const matchedPortion = this.portionsList.find(
        (portion) => portion.name.toLowerCase() === String(this.menuItemPriceObj.portionName).toLowerCase()
      );
      this.selectedPortionId = matchedPortion ? matchedPortion.id : 0;
    }
  }

  addMenuItemPrice(): void {
    this.syncPayloadFromSelections();
    this.http.post("http://localhost:8080/api/menu-item-price", this.menuItemPriceObj).subscribe(() => {
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
    };
    this.selectedItemId = 0;
    this.selectedPortionId = 0;
  }

  onEdit(menuItemPrice: MenuItemPriceModel): void {
    this.menuItemPriceObj = { ...menuItemPrice };
    this.syncSelectionsFromPayload();
    this.isEditMode = true;
  }

  updateMenuItemPrice(): void {
    this.syncPayloadFromSelections();
    this.http.put("http://localhost:8080/api/menu-item-price", this.menuItemPriceObj).subscribe(() => {
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
          next: () => {

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
