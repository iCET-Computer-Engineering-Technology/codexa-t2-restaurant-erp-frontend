import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component } from '@angular/core';
import { PortionsModel } from '../../../model/type';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-portions',
  imports: [FormsModule ,  CommonModule],
  templateUrl: './portions.html',
  styleUrl: './portions.css',
})
export class Portions {

  isEditMode : boolean = false;

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

  addPortion() : void {
    this.http.post("http://localhost:8080/portions" , this.portionsObj).subscribe(data => {
      this.getAll();
    })
  }

  clearForm(): void {
      this.portionsObj = {
      id : 0,
      name : ''
    }
  }

  onEdit(portions : PortionsModel) : void {
    this.portionsObj = { ...portions }; 
    this.isEditMode = true;
  }

  updatePortion() : void {
  this.http.put("http://localhost:8080/portions" , this.portionsObj).subscribe(data => {
    this.getAll();
    this.clearForm();
    this.isEditMode = false;
  })
}

deletePortion(id: number): void {
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
        this.http.delete(`http://localhost:8080/portions/${id}`).subscribe({
          next: (data) => {
            
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
