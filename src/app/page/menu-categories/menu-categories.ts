import { ChangeDetectorRef, Component } from '@angular/core';
import { CategoryModel } from '../../../model/type';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-menu-categories',
  imports: [ CommonModule],
  templateUrl: './menu-categories.html',
  styleUrl: './menu-categories.css',
})
export class MenuCategories {

  categoryList : Array<CategoryModel> = [];

  constructor(private http : HttpClient , private cdr: ChangeDetectorRef) {}

  ngOnInit() : void {
    this.getAll();
  }

  getAll(){
    this.http.get<CategoryModel[]>("http://localhost:8080/categories").subscribe(data => {
      this.categoryList = data;
      this.cdr.detectChanges();
    })
  }

}
