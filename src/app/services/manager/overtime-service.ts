import { Injectable } from '@angular/core';
import {HttpClient} from '@angular/common/http';

@Injectable({
  providedIn: 'root',
})
export class OvertimeService {
  private readonly api = 'http://localhost:8080/overtime';

  constructor(private readonly http: HttpClient) {}

  getAllOvertime() {
    return this.http.get(`${this.api}/get-all`);
  }
  addOvertime(data: any) {
    return this.http.post(`${this.api}/add`, data);
  }
  updateOvertime(data: any) {
    return this.http.put(`${this.api}/update`, data);
  }
  deleteOvertime(id: number |undefined) {
    return this.http.delete(`${this.api}/delete/${id}`);
  }
}
