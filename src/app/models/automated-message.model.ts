export type TriggerType = 'BIRTHDAY' | 'ANNIVERSARY' | 'LAPSED' | 'TIER_CHANGE';
export type ChannelType = 'EMAIL' | 'SMS';
export type OfferType = 'DISCOUNT' | 'FREE_ITEM' | 'NONE';

export interface AutomatedMessage {
  id?: number;
  triggerType: TriggerType;
  channel: ChannelType;
  templateBody?: string;
  offerType?: OfferType;
  offerValue?: number;
  sendDaysBefore?: number;
  isActive?: boolean;
  createdAt?: string;
}

export interface SendEmailRequest {
  subject: string;
  message: string;
  recipientType?: string;
}