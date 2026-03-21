import { HttpClient } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { OrderAssignment } from '../../../model/OrderAssignment';


@Component({
  selector: 'app-waiter',
  imports: [CommonModule],
  templateUrl: './waiter.html',
  styleUrl: './waiter.css',
})
export class Waiter implements OnInit {
  orderAssigmentList: Array<OrderAssignment> = [];
  showAddForm = false;
  OrderAssigmentobj: OrderAssignment = {
    id: 0,
    kitechenOrderId: 0,
    waiterId: 0,
    assignedAt: new Date(),
    waiterName: ''
  }

  // Avatar color palette for diversity
  private avatarColors = [
    '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', 
    '#f43f5e', '#f97316', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
    '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6'
  ];

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {
    
  }

  ngOnInit(): void {  
    this.getAll();
  }

  getAvatarColor(id: number): string {
    return this.avatarColors[id % this.avatarColors.length];
  }

  getStatusLabel(status?: string): string {
    if (!status) return 'Active';
    const statusMap: { [key: string]: string } = {
      'active': 'Active',
      'inactive': 'Inactive',
      'on_break': 'On Break'
    };
    return statusMap[status] || 'Active';
  }

  getStatusClass(status?: string): string {
    if (!status) return 'active';
    const classMap: { [key: string]: string } = {
      'active': 'active',
      'inactive': 'inactive',
      'on_break': 'on-break'
    };
    return classMap[status] || 'active';
  }

  getAll() {
    // Hardcoded waiter data with names and statuses
    const waiterData = [
      { id: 1, waiterName: 'Kamal Perera', status: 'active' as const, waiterId: 1, kitchenOrderId: 101 },
      { id: 2, waiterName: 'Nimal Silva', status: 'active' as const, waiterId: 2, kitchenOrderId: 102 },
      { id: 3, waiterName: 'Sunil Fernando', status: 'on_break' as const, waiterId: 3, kitchenOrderId: 103 },
      { id: 4, waiterName: 'Amal Jayasinghe', status: 'active' as const, waiterId: 4, kitchenOrderId: 104 },
      { id: 5, waiterName: 'Dilshan Rathnayake', status: 'inactive' as const, waiterId: 5, kitchenOrderId: 105 }
    ];

    // Map to OrderAssignment
    this.orderAssigmentList = waiterData.map((item: any) => {
      return {
        id: item.id,
        kitechenOrderId: item.kitchenOrderId,
        waiterId: item.waiterId,
        assignedAt: new Date(),
        waiterName: item.waiterName,
        status: item.status
      } as OrderAssignment;
    });
    
    console.log('Processed Data:', this.orderAssigmentList);
    this.cdr.detectChanges();
  }

}
