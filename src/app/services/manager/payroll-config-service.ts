import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class PayrollConfigService {
  private readonly api = 'http://localhost:8080/payroll-config';

  constructor(private readonly http: HttpClient) {}

  getAllPayrollConfig() {
    return this.http.get(`${this.api}/get-all`);
  }
  addPayrollConfig(data: any) {
    return this.http.post(`${this.api}/add`, data);
  }
  updatePayrollConfig(data: any) {
    return this.http.put(`${this.api}/update`, data);
  }
  deletePayrollConfig(id: number |undefined) {
    return this.http.delete(`${this.api}/delete/${id}`);
  }
}
