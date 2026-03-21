import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { MarketingCampaignDto } from "../models/campaign.model";

@Injectable({ providedIn: 'root' })
export class CampaignService {
  private readonly base = 'http://localhost:8080/api/campaigns';

  constructor(private readonly http: HttpClient) {}

  getAll(): Observable<MarketingCampaignDto[]> {
    return this.http.get<MarketingCampaignDto[]>(this.base);
  }

  getById(id: number): Observable<MarketingCampaignDto> {
    return this.http.get<MarketingCampaignDto>(`${this.base}/${id}`);
  }

  getByStatus(status: string): Observable<MarketingCampaignDto[]> {
    return this.http.get<MarketingCampaignDto[]>(`${this.base}/status/${status}`);
  }

  getByChannel(channel: string): Observable<MarketingCampaignDto[]> {
    return this.http.get<MarketingCampaignDto[]>(`${this.base}/channel/${channel}`);
  }

  getBySegment(segmentId: number): Observable<MarketingCampaignDto[]> {
    return this.http.get<MarketingCampaignDto[]>(`${this.base}/segment/${segmentId}`);
  }

  search(name: string): Observable<MarketingCampaignDto[]> {
    const params = new HttpParams().set('name', name);
    return this.http.get<MarketingCampaignDto[]>(`${this.base}/search`, { params });
  }

  create(dto: MarketingCampaignDto): Observable<MarketingCampaignDto> {
    return this.http.post<MarketingCampaignDto>(this.base, dto);
  }

  update(id: number, dto: MarketingCampaignDto): Observable<MarketingCampaignDto> {
    return this.http.put<MarketingCampaignDto>(`${this.base}/${id}`, dto);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.base}/${id}`);
  }

  send(id: number): Observable<any> {
    const url = `${this.base}/${id}/send`;
    return this.http.post<any>(url, {});
  }

  schedule(id: number, scheduledAt: string): Observable<any> {
    const url = `${this.base}/${id}/schedule`;
    const params = new HttpParams().set('scheduledAt', scheduledAt);
    return this.http.post<any>(url, {}, { params });
  }

  cancel(id: number): Observable<any> {
    const url = `${this.base}/${id}/cancel`;
    return this.http.post<any>(url, {});
  }
}