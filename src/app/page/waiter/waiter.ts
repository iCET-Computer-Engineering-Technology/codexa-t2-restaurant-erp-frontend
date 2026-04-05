import { HttpClient, HttpHeaders } from '@angular/common/http';
import { AfterViewInit, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Sidebar } from "../sidebar/sidebar";
import Swal from 'sweetalert2';

@Component({
  selector: 'app-waiter',
  standalone: true,
  imports: [CommonModule, Sidebar],
  templateUrl: './waiter.html',
  styleUrl: './waiter.css',
})
export class Waiter implements OnInit, AfterViewInit {
  orderAssigmentList: Array<any> = [];
  private apiUrl = 'http://localhost:8080';
  
  private avatarColors = ['#6366f1', '#8b5cf6', '#d946ef', '#ec4899', '#f43f5e', '#f97316'];
  
  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) {}
  
  ngOnInit(): void {
    this.getAll();
  }

  ngAfterViewInit(): void {
    import('flowbite').then((flowbite) => {
      flowbite.initFlowbite();
    });
  }
  
  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('token'); 
    let headers = new HttpHeaders({ 'Content-Type': 'application/json' });
    if (token) {
      headers = headers.set('Authorization', `Bearer ${token}`);
    }
    return headers;
  }
  
  getAll() {
    this.http.get<any[]>(`${this.apiUrl}/api/kitchen/assignments`, { headers: this.getHeaders() })
    .subscribe({
      next: (data) => {
        this.orderAssigmentList = data;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Error loading assignments:', err)
    });
  }
  
  // Served Button Click - Shows "Done!" message
  markAsServed(orderId: number, waiterId: number) {
    const requestBody = { orderId, waiterId, status: 'active' };

    this.http.post(`${this.apiUrl}/api/waiter/status`, requestBody, { 
      headers: this.getHeaders(), 
      responseType: 'text' 
    }).subscribe({
      next: () => {
        Swal.fire({
          title: "Done!",
          text: "Order served successfully.",
          icon: "success",
          timer: 1500,
          showConfirmButton: false
        });
        this.getAll();
      },
      error: (err) => Swal.fire("Error", "Status update failed!", "error")
    });
  }

  // Unserved Button Click - Sets status to Inactive
  markAsUnserved(orderId: number, waiterId: number) {
    const requestBody = { orderId, waiterId, status: 'inactive' };

    this.http.post(`${this.apiUrl}/api/waiter/status`, requestBody, { 
      headers: this.getHeaders(), 
      responseType: 'text' 
    }).subscribe({
      next: () => {
        Swal.fire({
          title: "Updated!",
          text: "Waiter status set to Inactive.",
          icon: "info",
          timer: 1500,
          showConfirmButton: false
        });
        this.getAll();
      },
      error: (err) => Swal.fire("Error", "Action failed!", "error")
    });
  }

  getAvatarColor(id: number): string {
    return this.avatarColors[id % this.avatarColors.length];
  }
  
  getStatusLabel(status?: string): string {
    if (!status) return 'Active';
    return status.toLowerCase() === 'inactive' ? 'Inactive' : 'Active';
  }
  
  getStatusClass(status?: string): string {
    if (!status) return 'active';
    return status.toLowerCase() === 'inactive' ? 'inactive' : 'active';
  }
}