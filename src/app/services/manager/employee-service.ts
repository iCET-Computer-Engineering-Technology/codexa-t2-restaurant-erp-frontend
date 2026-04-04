import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EmployeeService {
  private readonly api = 'http://localhost:8080/employee';

  constructor(private readonly http: HttpClient) {}

  //user
  getAllUser() {
    return this.http.get(`${this.api}/get-all-user`);
  }


  getAllEmployee() {
    console.log(`${this.api}/get-all`);
    return this.http.get(`${this.api}/get-all`);
  }
  addEmployee(data: any) {
    return this.http.post(`${this.api}/add`, data);
  }
  updateEmployee(data: any) {
    return this.http.put(`${this.api}/update`, data);
  }
  deleteEmployee(id: number |undefined) {
    return this.http.delete(`${this.api}/delete/${id}`);
  }

  getEmployeeById(id:number | undefined){
    return this.http.get(`${this.api}/getById/${id}`);
  }

    updateEmployeeById(id:number | undefined, data:any ){
    return this.http.put(`${this.api}/update/${id}`, data);
  }
}

