import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { MenuItemPriceModel } from '../../../model/type';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-menu-item-price',
  imports: [CommonModule],
  templateUrl: './menu-item-price.html',
  styleUrl: './menu-item-price.css',
})
export class MenuItemPrice {

  menuItemPriceList : Array<MenuItemPriceModel> = [];

  constructor(private http : HttpClient , private cdr : ChangeDetectorRef) {}

  ngOnInit() : void {
    this.getAll();
  }
  
  getAll(){
    this.http.get<MenuItemPriceModel[]>("http://localhost:8080/menu-item-price").subscribe(data => {
      this.menuItemPriceList = data;
      this.cdr.detectChanges();
    })
  }

}
