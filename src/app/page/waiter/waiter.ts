import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-waiter',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './waiter.html',
  styleUrl: './waiter.css',
})
export class Waiter implements OnInit {
  orderAssigmentList: Array<any> = [];
 
  private apiUrl = 'http://localhost:8080';
 
  private avatarColors = [
    '#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#f97316'
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
    this.http.get<any[]>(`${this.apiUrl}/api/kitchen/assignments`)
    .subscribe({
      next: (data) => {
        this.orderAssigmentList = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading assignments:', err)
    });
  }
 
  markAsServed(orderId: number, waiterId: number) {
    const requestBody = {
      orderId: orderId,
      waiterId: waiterId,
      status: 'served'
    };

    this.http.post(
      `${this.apiUrl}/api/waiter/status`,
      requestBody,
      { headers: this.getHeaders(), responseType: 'text' }
    ).subscribe({
      next: (response) => {
        alert(response); 
        this.getAll();
      },
      error: (err) => console.error('Error updating status:', err)
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