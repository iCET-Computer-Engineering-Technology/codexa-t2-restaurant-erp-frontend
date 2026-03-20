import { CommonModule } from '@angular/common';
import { ChangeDetectorRef, Component } from '@angular/core';
import { MenuItemsModel } from '../../../model/type';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-menu-items',
  imports: [CommonModule],
  templateUrl: './menu-items.html',
  styleUrl: './menu-items.css',
})
export class MenuItems {

  menuItemList : Array<MenuItemsModel> = [];

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
}
