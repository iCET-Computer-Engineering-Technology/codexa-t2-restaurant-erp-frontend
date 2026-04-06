import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class EmployeeLeaveService {
  private readonly api = 'http://localhost:8080/employee-leave';

  constructor(private readonly http: HttpClient) {}

  getAllEmployeeLeave() {
    return this.http.get(`${this.api}/get-all`);
  }
  addEmployeeLeave(data: any) {
    return this.http.post(`${this.api}/add`, data);
  }
  updateEmployeeLeave(data: any) {
    return this.http.put(`${this.api}/update`, data);
  }
  deleteEmployeeLeave(id: number |undefined) {
    return this.http.delete(`${this.api}/delete/${id}`);
  }
}
