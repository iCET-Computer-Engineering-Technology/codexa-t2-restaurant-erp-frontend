import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class DeductionService {
  private readonly api = 'http://localhost:8080/deduction';

  constructor(private readonly http: HttpClient) {}

  getAllDeduction() {
    return this.http.get(`${this.api}/get-all`);
  }
  addDeduction(data: any) {
    return this.http.post(`${this.api}/add`, data);
  }
  updateDeduction(data: any) {
    return this.http.put(`${this.api}/update`, data);
  }
  deleteDeduction(id: number |undefined) {
    return this.http.delete(`${this.api}/delete/${id}`);
  }
}
