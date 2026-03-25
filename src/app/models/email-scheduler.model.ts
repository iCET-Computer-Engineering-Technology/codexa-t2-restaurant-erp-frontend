export interface EmailSchedulerConfig {
  id?: number;
  sendTime: string; // HH:MM:SS format
  createdAt?: string | Date;
  updatedAt?: string | Date;
}
