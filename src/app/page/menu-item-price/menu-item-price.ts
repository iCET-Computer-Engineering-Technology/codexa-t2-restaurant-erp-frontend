import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { MenuItemPriceModel } from '../../../model/type';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

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

}
