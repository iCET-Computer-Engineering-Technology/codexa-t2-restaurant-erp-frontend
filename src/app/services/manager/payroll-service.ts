import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class PayrollService {
  private readonly api = 'http://localhost:8080/payroll';

  constructor(private readonly http: HttpClient) {}

  getAllBasicSalaries() {
    return this.http.get(`${this.api}/get-all`);
  }
  addPayroll(data: any) {
    return this.http.post(`${this.api}/add`, data);
  }
  updatePayroll(data: any) {
    return this.http.put(`${this.api}/update`, data);
  }
  deletePayroll(id: number |undefined) {
    return this.http.delete(`${this.api}/delete/${id}`);
  }
  getPayrollByEmployeeId(employeeId: number) {
    return this.http.get(`${this.api}/getById/${employeeId}`);
  }

  getTotalBonus(employeeId: number) {
    return this.http.get(`${this.api}/totalBonus/${employeeId}`);
  }

  getTotalDonation(employeeId: number) {
    return this.http.get(`${this.api}/totalDonation/${employeeId}`);
  }

  getTotalOvertime(employeeId: number) {
    return this.http.get(`${this.api}/totalOvertime/${employeeId}`);
  }

  getTotalLeaveDays(employeeId: number) {
    return this.http.get(`${this.api}/totalLaveDays/${employeeId}`);
  }

  getTotalEPF(employeeId: number) {
    return this.http.get(`${this.api}/totalEPF/${employeeId}`);
  }

  getTotalETF(employeeId: number) {
    return this.http.get(`${this.api}/totalETF/${employeeId}`);
  }

  getTotalAllowances(employeeId: number) {
    return this.http.get(`${this.api}/totalAllowances/${employeeId}`);
  }
}
