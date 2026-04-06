import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-admin-customer',
  template: '<div>Admin Customer Component</div>',
  styles: []
})
export class AdminCustomerComponent implements OnInit {

  customers: any[] = [];

  constructor(
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers() {
    this.http.get<any[]>('http://localhost:8080/customers').subscribe({
      next: (data) => {
        this.customers = data;
      },
      error: (err) => {
        console.error('Failed to load customers:', err);
      }
    });
  }

  viewCustomerProfile(customerId: number): void {
    if (customerId) {
      this.router.navigate(['/admin/customer-profile', customerId]);
    }
  }
}