import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { PortionsModel } from '../../../model/type';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-portions',
  imports: [FormsModule ,  CommonModule],
  templateUrl: './portions.html',
  styleUrl: './portions.css',
})
export class Portions {

  portionsList : Array<PortionsModel> = [];

  portionsObj : PortionsModel = {
    id : 0,
    name : ''
  }

  constructor(private http : HttpClient , private cdr : ChangeDetectorRef) {}

  ngOnInit() : void {
    this.getAll();
  } 

  getAll(){
    this.http.get<PortionsModel[]>("http://localhost:8080/portions").subscribe(data => {
      this.portionsList = data;
      this.cdr.detectChanges();
    })
  }

  addCategory() : void {
    this.http.post("http://localhost:8080/portions" , this.portionsObj).subscribe(data => {
      this.getAll();
    })
  }

}
