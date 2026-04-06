import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class AllowanceService {
  private readonly api = 'http://localhost:8080/allowance';

  constructor(private readonly http: HttpClient) {}

  getAllAllowance() {
    return this.http.get(`${this.api}/get-all`);
  }
  addAllowance(data: any) {
    return this.http.post(`${this.api}/add`, data);
  }
  updateAllowance(data: any) {
    return this.http.put(`${this.api}/update`, data);
  }
  deleteAllowance(id: number |undefined) {
    return this.http.delete(`${this.api}/delete/${id}`);
  }
}
