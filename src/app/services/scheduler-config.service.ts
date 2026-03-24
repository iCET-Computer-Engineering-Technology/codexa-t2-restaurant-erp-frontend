import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { SchedulerConfig } from '../models/scheduler-config.model';

@Injectable({ providedIn: 'root' })
export class SchedulerConfigService {
  private readonly base = 'http://localhost:8080/api/admin/scheduler-config';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<SchedulerConfig[]> {
    return this.http.get<SchedulerConfig[]>(this.base);
  }

  getById(id: number): Observable<SchedulerConfig> {
    return this.http.get<SchedulerConfig>(`${this.base}/${id}`);
  }

  getByUser(userId: number): Observable<SchedulerConfig[]> {
    return this.http.get<SchedulerConfig[]>(`${this.base}/user/${userId}`);
  }

  getByTask(taskName: string): Observable<SchedulerConfig> {
    return this.http.get<SchedulerConfig>(`${this.base}/task/${taskName}`);
  }

  create(config: SchedulerConfig): Observable<SchedulerConfig> {
    return this.http.post<SchedulerConfig>(this.base, config);
  }

  update(id: number, config: SchedulerConfig): Observable<SchedulerConfig> {
    return this.http.put<SchedulerConfig>(`${this.base}/${id}`, config);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }
}
