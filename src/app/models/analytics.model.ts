export interface CampaignMetrics {
  campaignId: number;
  campaignName?: string;
  sent?: number;
  opens?: number;
  clicks?: number;
  conversions?: number;
  unsubscribes?: number;
}