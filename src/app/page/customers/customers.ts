import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService, Customer } from '../../services/customer.service';

@Component({
  selector: 'app-customers',
  imports: [CommonModule, FormsModule],
  templateUrl: './customers.html',
  styleUrl: './customers.css',
})
export class Customers implements OnInit {
  customers: Customer[] = [];
  filteredCustomers: Customer[] = [];
  searchQuery = '';
  loading = false;
  errorMessage = '';
  successMessage = '';

  showModal = false;
  isEditMode = false;
  selectedCustomer: Customer = { name: '', email: '', phone: '', address: '' };

  showDeleteModal = false;
  customerToDelete: Customer | null = null;

  constructor(private customerService: CustomerService) {}

  ngOnInit(): void {
    this.loadCustomers();
  }

  loadCustomers(): void {
    this.loading = true;
    this.errorMessage = '';
    this.customerService.getAll().subscribe({
      next: (data) => {
        this.customers = data;
        this.applyFilter();
        this.loading = false;
      },
      error: () => {
        this.errorMessage = 'Failed to load customers. Please try again.';
        this.loading = false;
      },
    });
  }

  applyFilter(): void {
    const q = this.searchQuery.trim().toLowerCase();
    if (!q) {
      this.filteredCustomers = [...this.customers];
    } else {
      this.filteredCustomers = this.customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.phone.toLowerCase().includes(q),
      );
    }
  }

  onSearchChange(): void {
    this.applyFilter();
  }

  openAddModal(): void {
    this.isEditMode = false;
    this.selectedCustomer = { name: '', email: '', phone: '', address: '' };
    this.showModal = true;
  }

  openEditModal(customer: Customer): void {
    this.isEditMode = true;
    this.selectedCustomer = { ...customer };
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.errorMessage = '';
  }

  saveCustomer(): void {
    if (this.isEditMode && this.selectedCustomer.id !== undefined) {
      this.customerService.update(this.selectedCustomer.id, this.selectedCustomer).subscribe({
        next: () => {
          this.showSuccessMessage('Customer updated successfully.');
          this.closeModal();
          this.loadCustomers();
        },
        error: () => {
          this.errorMessage = 'Failed to update customer. Please try again.';
        },
      });
    } else {
      this.customerService.create(this.selectedCustomer).subscribe({
        next: () => {
          this.showSuccessMessage('Customer added successfully.');
          this.closeModal();
          this.loadCustomers();
        },
        error: () => {
          this.errorMessage = 'Failed to add customer. Please try again.';
        },
      });
    }
  }

  openDeleteModal(customer: Customer): void {
    this.customerToDelete = customer;
    this.showDeleteModal = true;
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.customerToDelete = null;
  }

  confirmDelete(): void {
    if (this.customerToDelete?.id !== undefined) {
      this.customerService.delete(this.customerToDelete.id).subscribe({
        next: () => {
          this.showSuccessMessage('Customer deleted successfully.');
          this.closeDeleteModal();
          this.loadCustomers();
        },
        error: () => {
          this.errorMessage = 'Failed to delete customer. Please try again.';
          this.closeDeleteModal();
        },
      });
    }
  }

  private showSuccessMessage(msg: string): void {
    this.successMessage = msg;
    setTimeout(() => {
      this.successMessage = '';
    }, 3000);
  }
}
