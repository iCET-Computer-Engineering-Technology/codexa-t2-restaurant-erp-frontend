import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class BonusService {
  private readonly api = 'http://localhost:8080/bonus';

  constructor(private readonly http: HttpClient) {}

  getAllBonus() {
    return this.http.get(`${this.api}/get-all`);
  }
  addBonus(data: any) {
    return this.http.post(`${this.api}/add`, data);
  }
  updateBonus(data: any) {
    return this.http.put(`${this.api}/update`, data);
  }
  deleteBonus(id: number |undefined) {
    return this.http.delete(`${this.api}/delete/${id}`);
  }
}
