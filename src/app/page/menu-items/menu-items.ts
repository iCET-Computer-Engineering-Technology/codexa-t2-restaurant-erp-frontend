import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { MenuItemsModel } from '../../../model/type';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-menu-items',
  imports: [FormsModule , CommonModule],
  templateUrl: './menu-items.html',
  styleUrl: './menu-items.css',
})
export class MenuItems {

  menuItemList : Array<MenuItemsModel> = [];
  menuItemObj : MenuItemsModel = {
    id : 0,
    name : '',
    categoryId : 0,
    description : '',
    isAvailable : true,
    imageUrl : ''

  }

  constructor(private http : HttpClient , private cdr : ChangeDetectorRef) {}

  ngOnInit() : void {
    this.getAll();
  }

  getAll(){
    this.http.get<MenuItemsModel[]>("http://localhost:8080/menu-items").subscribe(data => {
      this.menuItemList = data;
      this.cdr.detectChanges();
    })
  }

  addMenuItem() : void {
    this.http.post("http://localhost:8080/menu-items", this.menuItemObj).subscribe(data => {
      this.getAll();
    })
  }
}
