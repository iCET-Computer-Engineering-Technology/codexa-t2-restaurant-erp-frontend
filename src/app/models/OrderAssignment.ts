export interface OrderAssignment {
   id: number;
   kitchenOrderId: number;
   waiterId: number;
   assignedAt: Date;
   waiterName: string;
   status?: 'active' | 'inactive' | 'on_break';
}