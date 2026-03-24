export interface OrderAssignment {
   id: number;
   kitechenOrderId: number;
   waiterId: number;
   assignedAt: Date;
   waiterName: string;
   status?: 'active' | 'inactive' | 'on_break';
}