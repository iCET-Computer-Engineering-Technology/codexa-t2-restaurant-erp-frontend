import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { forkJoin } from 'rxjs';
import { AnalyticsService } from '../../../../services/analytics.service';
import { CampaignService } from '../../../../services/campaign.service';
import { MarketingCampaignDto } from '../../../../models/campaign.model';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics.html',
  styleUrls: ['../marketing-campaign.css']
})
export class AnalyticsComponent implements OnInit {
  loading = signal(true);
  campaigns: MarketingCampaignDto[] = [];
  selectedCampaignId: number | null = null;
  allMetrics: any[] = [];
  funnelData: any = null;
  metrics = { sent: 0, openRate: '—', clickRate: '—', conversions: 0 };

  constructor(
    private readonly analyticsService: AnalyticsService,
    private readonly campaignService: CampaignService
  ) {}

  ngOnInit(): void {
    this.loading.set(true);
    forkJoin({
      campaigns: this.campaignService.getAll(),
      metrics: this.analyticsService.getAllMetrics()
    }).subscribe({
      next: (result) => {
        this.campaigns = result.campaigns || [];
        this.allMetrics = Array.isArray(result.metrics) ? result.metrics : [];
        this.computeOverallMetrics();
        this.loading.set(false);
        console.log('Analytics data loaded:', { campaigns: this.campaigns.length, metrics: this.allMetrics.length });
      },
      error: (error) => {
        console.error('Error loading analytics data:', error);
        this.loading.set(false);
      }
    });
  }

  computeOverallMetrics(): void {
    const totSent = this.allMetrics.reduce((a, m) => a + (m.sent || 0), 0);
    const totOpens = this.allMetrics.reduce((a, m) => a + (m.opens || 0), 0);
    const totClicks = this.allMetrics.reduce((a, m) => a + (m.clicks || 0), 0);
    const totConv = this.allMetrics.reduce((a, m) => a + (m.conversions || 0), 0);
    this.metrics = {
      sent: totSent,
      openRate: totSent ? Math.round(totOpens / totSent * 100) + '%' : '—',
      clickRate: totSent ? Math.round(totClicks / totSent * 100) + '%' : '—',
      conversions: totConv
    };
  }

  onCampaignChange(id: number): void {
    this.selectedCampaignId = id;
    if (!id) {
      this.funnelData = null;
      return;
    }
    console.log('Loading metrics for campaign:', id);
    this.analyticsService.getCampaignMetrics(id).subscribe({
      next: (data) => {
        console.log('Campaign metrics loaded:', data);
        this.funnelData = data;
      },
      error: (error) => {
        console.error('Error loading campaign metrics:', error);
        this.funnelData = null;
      }
    });
  }

  getFunnelRows(): { label: string; value: number; pct: number; color: string }[] {
    if (!this.funnelData) return [];
    const sent = this.funnelData.sent || this.funnelData.totalSent || 0;
    if (!sent) return [];
    const pct = (v: number) => Math.round(v / sent * 100);
    return [
      { label: 'Sent',      value: sent,                                    pct: 100,                    color: 'sent' },
      { label: 'Opened',    value: this.funnelData.opens || 0,              pct: pct(this.funnelData.opens || 0),       color: 'open' },
      { label: 'Clicked',   value: this.funnelData.clicks || 0,             pct: pct(this.funnelData.clicks || 0),      color: 'click' },
      { label: 'Converted', value: this.funnelData.conversions || 0,        pct: pct(this.funnelData.conversions || 0), color: 'conversion' },
      { label: 'Unsub',     value: this.funnelData.unsubscribes || 0,       pct: pct(this.funnelData.unsubscribes || 0), color: 'unsub' },
    ];
  }
}