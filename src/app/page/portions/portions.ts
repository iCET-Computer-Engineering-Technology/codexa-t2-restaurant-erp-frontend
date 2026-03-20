import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { PortionsModel } from '../../../model/type';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-portions',
  imports: [CommonModule],
  templateUrl: './portions.html',
  styleUrl: './portions.css',
})
export class Portions {

  portionsList : Array<PortionsModel> = [];

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

}
