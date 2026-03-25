// import { CommonModule } from '@angular/common';
// import { ChangeDetectorRef, Component } from '@angular/core';
// import { CategoryModel, MenuItemPriceModel, PortionsModel } from '../../../model/type';
// import { HttpClient } from '@angular/common/http';
// import { FormsModule } from '@angular/forms';
// import Swal from 'sweetalert2';

// @Component({
//   selector: 'app-menu-item-price',
//   imports: [FormsModule, CommonModule],
//   templateUrl: './menu-item-price.html',
//   styleUrl: './menu-item-price.css',
// })
// export class MenuItemPrice {

//   isEditMode: boolean = false;

//   menuItemPriceList: Array<MenuItemPriceModel> = [];
//   itemList: any[] = [];
//   portionList : Array<PortionsModel> = [];
//   menuItemPriceObj: MenuItemPriceModel = {
//     id: 0,
//     itemName: '',
//     portionName: '',
//     price: 0.0,
//     isActive: true,
//     itemId : 0,
//     portionId : 0
//   }

//   constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

//     // Add this function to fetch the data from your APIs
//     loadDropdownData(): void {
//     // Fetch Categories
//     this.http.get<any[]>("http://localhost:8080/menu-items").subscribe(data => {
//       this.itemList = data;
//     });

//     // Fetch Portions
//     this.http.get<any[]>("http://localhost:8080/portions").subscribe(data => {
//       this.portionList = data;
//     });
//   }

//   ngOnInit(): void {
//     this.getAll();
//     this.loadDropdownData();
//   }

//   getAll() {
//     this.http.get<MenuItemPriceModel[]>("http://localhost:8080/menu-item-price/get-full-menu").subscribe(data => {
//       this.menuItemPriceList = data;
//       this.cdr.detectChanges();
//     })
//   }

//   addMenuItemPrice(): void {
//     this.http.post("http://localhost:8080/menu-item-price", this.menuItemPriceObj).subscribe(data => {
//       this.getAll();
//     })
//   }

//   clearForm(): void {
//     this.menuItemPriceObj = {
//       id: 0,
//       itemName: '',
//       portionName: '',
//       price: 0.0,
//       isActive: true,
//       itemId : 0,
//       portionId : 0
//     }
//   }

//   onEdit(menuItemPrice: MenuItemPriceModel): void {
//     this.menuItemPriceObj = { ...menuItemPrice };
//     this.isEditMode = true;
//   }

//   updateMenuItemPrice(): void {
//     this.http.put("http://localhost:8080/menu-item-price", this.menuItemPriceObj).subscribe(data => {
//       this.getAll();
//       this.clearForm();
//       this.isEditMode = false;
//     })
//   }

//   deleteMenuItemPrice(id: number): void {
//     Swal.fire({
//       title: "Are you sure?",
//       text: "You won't be able to revert this!",
//       icon: "warning",
//       showCancelButton: true,
//       confirmButtonColor: "#dc2626",
//       cancelButtonColor: "#6b7280",
//       confirmButtonText: "Yes, delete it!"
//     }).then((result) => {

//       if (result.isConfirmed) {
//         this.http.delete(`http://localhost:8080/menu-item-price/${id}`).subscribe({
//           next: (data) => {

//             Swal.fire({
//               title: "Deleted!",
//               text: "The item has been deleted.",
//               icon: "success"
//             });
//             this.getAll();
//           },
//           error: (err) => {
//             console.error("Delete failed:", err);
//             Swal.fire("Error", "Could not delete the item.", "error");
//           }
//         });
//       }
//     });
//   }
// }

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
    // Fetch Items
    this.http.get<any[]>("http://localhost:8080/menu-items").subscribe(data => {
      this.itemList = data;
    });

    // Fetch Portions
    this.http.get<any[]>("http://localhost:8080/portions").subscribe(data => {
      this.portionList = data;
    });
  }

  getAll() {
    this.http.get<MenuItemPriceModel[]>("http://localhost:8080/menu-item-price/get-full-menu").subscribe(data => {
      this.menuItemPriceList = data;
      this.cdr.detectChanges();
    });
  }

  addMenuItemPrice(): void {
    this.http.post("http://localhost:8080/menu-item-price", this.menuItemPriceObj).subscribe(data => {
      this.getAll();
      this.clearForm(); // Clears form after saving
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