import { HttpClient, HttpHeaders } from '@angular/common/http';
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
 
  private apiUrl = 'http://localhost:8080';
 
  private avatarColors = [
    '#6366f1', '#8b5cf6', '#d946ef', '#ec4899',
    '#f43f5e', '#f97316', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4',
    '#0ea5e9', '#3b82f6', '#6366f1', '#8b5cf6'
  ];
 
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
 
  ngOnInit(): void {
    this.getAll();
  }
 
  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'application/json'
    });
  }
 
  getAll() {
    this.http.get<OrderAssignment[]>(
      `${this.apiUrl}/api/kitchen/assignments`,
      { headers: this.getHeaders() }
    ).subscribe({
      next: (data) => {
        this.orderAssigmentList = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading assignments:', err)
    });
  }
 
  markAsServed(orderId: number, waiterId: number) {
    this.http.post(
      `${this.apiUrl}/api/waiter/status`,
      { orderId, waiterId, status: 'served' },
      { headers: this.getHeaders(), responseType: 'text' }
    ).subscribe({
      next: () => {
        alert('Kitchen notified as Done! ✅');
        this.getAll();
      },
      error: (err) => console.error('Error:', err)
    });
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
}