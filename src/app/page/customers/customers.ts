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

  isUpdateMode: boolean = false;

  newCustomer = {
    id: 0,
    name: '',
    email: '',
    phone: '',
    address: ''
  };

  constructor(private http: HttpClient, private cdr: ChangeDetectorRef) { }

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.http.get<any[]>('http://localhost:8080/customers/get-all').subscribe({
      next: (data) => {
        this.customers = data;
        this.filteredCustomers = data;
        this.totalCustomers = data.length;
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load customer data:', err)
    });
  }

  resetForm() {
    this.isUpdateMode = false;
    this.newCustomer = { id: 0, name: '', email: '', phone: '', address: '' };
  }

  editCustomer(customer: any) {
    this.isUpdateMode = true;
    this.newCustomer = { ...customer };
  }

  saveCustomer() {
    if (!this.newCustomer.name || !this.newCustomer.name.trim() ||
      !this.newCustomer.phone || !this.newCustomer.phone.trim()) {
      Swal.fire({
        icon: "warning",
        title: "Missing Details"
      });
      return;
    }

    if (this.isUpdateMode) {
      this.http.put<boolean>('http://localhost:8080/customers/update', this.newCustomer).subscribe({
        next: (res) => {
          if (res) {
            Swal.fire({
              title: "Update Successfully!",
              icon: "success",
              draggable: true
            });
            this.resetForm();
            this.loadCustomers();
          }
        },
        error: (err) => {
          console.error('Error updating customer:', err);
          Swal.fire({
            icon: "error",
            title: "Oops...",
            text: "Something went wrong!"
          });
        }
      });
    } else {
      this.http.post<boolean>('http://localhost:8080/customers/add', this.newCustomer).subscribe({
        next: (res) => {
          if (res) {
            Swal.fire({
              title: "Customer added successfully!",
              icon: "success"
            });
            this.resetForm();
            this.loadCustomers();
          }
        },
        error: (err) => {
          console.error('Error saving customer:', err);
          Swal.fire({
            icon: "error",
            title: "Failed to save customer. Please try again."
          });
        }
      });
    }
  }

  deleteCustomer(phone: string) {
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this customer?",
      icon: "warning",
      showDenyButton: true,
      confirmButtonText: "Delete",
      denyButtonText: `Cancel`
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.http.delete<boolean>('http://localhost:8080/customers/delete/' + phone).subscribe({
          next: (res) => {
            if (res) {
              Swal.fire('Deleted!', 'Customer deleted successfully!', 'success');
              this.loadCustomers();
              this.resetForm();
            }
          },
          error: (err) => {
            console.error('Error deleting customer:', err);
            Swal.fire('Error!', 'Failed to delete customer', 'error');
          }
        });
      }
    });
  }

  onSearch() {
    if (this.searchText.trim() === '') {
      this.filteredCustomers = this.customers;
    } else {
      const text = this.searchText.toLowerCase();
      this.filteredCustomers = this.customers.filter(c =>
        (c.name && c.name.toLowerCase().includes(text)) ||
        (c.email && c.email.toLowerCase().includes(text)) ||
        (c.phone && c.phone.toLowerCase().includes(text)) ||
        (c.address && c.address.toLowerCase().includes(text))
      );
    }
  }
}
