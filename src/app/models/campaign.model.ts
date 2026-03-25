export interface MarketingCampaignDto {
  id?: number;
  campaignName: string;
  segmentId?: number;
  channel: string;
  subject?: string;
  bodyTemplate?: string;
  abTestEnabled?: boolean;
  variantBBody?: string;
  scheduledAt?: string;
  sentAt?: string;
  status?: string;
  createdBy?: number;
  createdAt?: string;
}