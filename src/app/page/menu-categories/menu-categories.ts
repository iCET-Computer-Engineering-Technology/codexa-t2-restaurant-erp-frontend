import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CategoryModel } from '../../../model/type';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { isActive } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

@Component({
  selector: 'app-menu-categories',
  imports: [  ReactiveFormsModule, FormsModule,  CommonModule],
  templateUrl: './menu-categories.html',
  styleUrl: './menu-categories.css',
})
export class MenuCategories {
  
  
  
  categoryList : Array<CategoryModel> = [];
  categoryObj : CategoryModel = {
    id : 0,
    name : '',
    isActive : true
  }

  constructor(private http : HttpClient , private cdr: ChangeDetectorRef) {}

  ngOnInit(): void {
    this.getAll();
  }
  

  getAll(){
    this.http.get<CategoryModel[]>("http://localhost:8080/categories").subscribe(data => {
      this.categoryList = data;
      this.cdr.detectChanges();
    })
  }

  addCategory() : void {
    this.http.post("http://localhost:8080/categories" , this.categoryObj).subscribe(data => {
      this.getAll();
    })
  }

}


