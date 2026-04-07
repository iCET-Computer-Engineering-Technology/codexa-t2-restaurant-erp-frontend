import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BasicSalaryService {
  private readonly api = 'http://localhost:8080/basic-salary';

  constructor(private readonly http: HttpClient) {}

  getAllBasicSalaries() {
    return this.http.get(`${this.api}/get-all`);
  }
  addBasicSalary(data: any) {
    return this.http.post(`${this.api}/add`, data);
  }
  updateBasicSalary(data: any) {
   return this.http.put(`${this.api}/update`, data);
  }
  deleteBasicSalary(id: number |undefined) {
   return this.http.delete(`${this.api}/delete/${id}`);
  }
  getBasicSalaryByRole(role: string) {
    return this.http.get(`${this.api}/get-by-role/${role}`);
  }
}
