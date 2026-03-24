import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';
import { EmailSchedulerConfig } from '../models/email-scheduler.model';

@Injectable({
  providedIn: 'root',
})
export class EmailSchedulerService {
  private readonly apiUrl = `${environment.apiUrl}/admin/automated-messages/scheduler`;

  constructor(private readonly http: HttpClient) {}

  getConfig(): Observable<EmailSchedulerConfig> {
    return this.http.get<EmailSchedulerConfig>(this.apiUrl);
  }

  updateConfig(config: EmailSchedulerConfig): Observable<EmailSchedulerConfig> {
    return this.http.put<EmailSchedulerConfig>(this.apiUrl, config);
  }
}
