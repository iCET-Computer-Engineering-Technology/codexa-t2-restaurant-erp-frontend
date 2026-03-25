export interface SchedulerConfig {
  id?: number;
  taskName: string;
  cronExpression: string;
  timezone?: string;
  startTime?: string;
  endTime?: string;
  isActive?: boolean;
  description?: string;
  userId?: number;
}
