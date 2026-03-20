import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule],
  templateUrl: './customers.html',
  styleUrls: ['./customers.css']
})
export class Customers implements OnInit {
  customers: any[] = [];
  filteredCustomers: any[] = [];
  totalCustomers: number = 0;
  searchText: string = '';

  paginatedCustomers: any[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;

  isUpdateMode: boolean = false;
  isSubmitted: boolean = false;

  showProfileModal: boolean = false;
  selectedCustomer: any = null;
  visitHistory: any[] = [];

  newCustomer = {
    id: 0, firstName: '', lastName: '', email: '', phone: '',
    birthday: '', preferredLanguage: 'en', dietaryNotes: '',
    communicationEmail: 1, communicationSms: 1, loyaltyPoints: 0
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.http.get<any[]>('http://localhost:8080/customers').subscribe({
      next: (data) => {
        this.customers = data;
        this.filteredCustomers = data;
        this.totalCustomers = data.length;
        this.updatePagination();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load customers:', err)
    });
  }

customerProfile: any = null;

viewProfile(customer: any) {
  this.showProfileModal = true;
  this.selectedCustomer = customer;

  this.http.get<any>('http://localhost:8080/customers/profile').subscribe({
    next: (data) => {
      this.customerProfile = data;
      console.log('Profile Data:', data);
    },
    error: (err) => {
      console.error('Failed to load profile:', err);
      this.customerProfile = { ...customer, last10Visits: [], loyaltyPoints: 0, lifetimeSpend: 0 };
    }
  });
}

closeProfile() {
  this.showProfileModal = false;
  this.customerProfile = null;
}

  updatePagination() {
    this.totalPages = Math.ceil(this.filteredCustomers.length / this.itemsPerPage);
    if (this.totalPages === 0) this.totalPages = 1;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedCustomers = this.filteredCustomers.slice(startIndex, startIndex + this.itemsPerPage);
  }

  nextPage() { if (this.currentPage < this.totalPages) { this.currentPage++; this.updatePagination(); } }
  prevPage() { if (this.currentPage > 1) { this.currentPage--; this.updatePagination(); } }

  resetForm() {
    this.isUpdateMode = false;
    this.isSubmitted = false;
    this.newCustomer = { 
      id: 0, firstName: '', lastName: '', email: '', phone: '', 
      birthday: '', preferredLanguage: 'en', dietaryNotes: '', 
      communicationEmail: 1, communicationSms: 1, loyaltyPoints: 0 
    };
  }

  editCustomer(customer: any) {
    this.isUpdateMode = true;
    this.isSubmitted = false;
    this.newCustomer = { ...customer };
  }

  isValidFirstName() { return this.newCustomer.firstName && this.newCustomer.firstName.trim() !== ''; }
  isValidLastName() { return this.newCustomer.lastName && this.newCustomer.lastName.trim() !== ''; }
  isValidEmail() {
    if (!this.newCustomer.email || this.newCustomer.email.trim() === '') return true;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(this.newCustomer.email);
  }
  isValidPhone() { return /^07[01245678]\d{7}$/.test(this.newCustomer.phone.trim()); }

  saveCustomer() {
    this.isSubmitted = true;
    if (!this.isValidFirstName() || !this.isValidLastName() || !this.isValidEmail() || !this.isValidPhone()) return;

    const url = this.isUpdateMode ? 'http://localhost:8080/customers' : 'http://localhost:8080/customers';
    const request = this.isUpdateMode ? this.http.put<boolean>(url, this.newCustomer) : this.http.post<boolean>(url, this.newCustomer);

    request.subscribe({
      next: (res) => {
        if (res) {
          Swal.fire({ title: this.isUpdateMode ? "Updated!" : "Saved!", icon: "success", timer: 1500 });
          this.resetForm();
          this.loadCustomers();
        }
      },
      error: (err) => this.handleBackendError(err)
    });
  }

  handleBackendError(err: any) {
    let msg = err.status === 400 && err.error ? (typeof err.error === 'string' ? err.error : Object.values(err.error)[0]) : "Error occurred!";
    Swal.fire({ icon: "error", title: "Failed!", text: msg as string });
  }

  deleteCustomer(phone: string) {
    Swal.fire({ title: "Are you sure?", text: "Delete this customer?", icon: "warning", showCancelButton: true, confirmButtonColor: '#ef4444' }).then((result) => {
      if (result.isConfirmed) {
        this.http.delete<boolean>('http://localhost:8080/customers/delete/'+phone).subscribe({
          next: () => { Swal.fire('Deleted!', '', 'success'); this.loadCustomers(); },
          error: () => Swal.fire('Error!', 'Failed to delete', 'error')
        });
      }
    });
  }

  onSearch() {
    const text = this.searchText.toLowerCase();
    this.filteredCustomers = this.customers.filter(c => 
      (c.firstName && c.firstName.toLowerCase().includes(text)) || 
      (c.lastName && c.lastName.toLowerCase().includes(text)) || 
      (c.phone && c.phone.includes(text))
    );
    this.currentPage = 1;
    this.updatePagination();
  }
}