import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import Swal from 'sweetalert2';
import { SupplierService } from '../../services/supplier.service';
import { Supplier } from '../../models/supplier.model';
import { Sidebar } from "../sidebar/sidebar";

@Component({
  selector: 'app-suppliers',
  standalone: true,
  imports: [CommonModule, HttpClientModule, FormsModule, Sidebar],
  templateUrl: './supplier.html',
  styleUrls: ['./supplier.css']
})
export class Suppliers implements OnInit {

  suppliers: Supplier[] = [];
  filteredSuppliers: Supplier[] = [];
  totalSuppliers: number = 0;
  searchText: string = '';

  paginatedSuppliers: Supplier[] = [];
  currentPage: number = 1;
  itemsPerPage: number = 10;
  totalPages: number = 1;

  isUpdateMode: boolean = false;
  isSubmitted: boolean = false;

  newSupplier: Supplier = {
    id: undefined,
    name: '',
    contactName: '',
    email: '',
    phone: '',
    address: ''
  };

  constructor(
    private supplierService: SupplierService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadSuppliers();
  }

  loadSuppliers(): void {
    this.supplierService.getAllSuppliers().subscribe({
      next: (data) => {
        this.suppliers = data;
        this.filteredSuppliers = data;
        this.totalSuppliers = data.length;
        this.updatePagination();
        this.cdr.detectChanges();
      },
      error: (err) => console.error('Failed to load suppliers:', err)
    });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredSuppliers.length / this.itemsPerPage);
    if (this.totalPages === 0) this.totalPages = 1;
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    this.paginatedSuppliers = this.filteredSuppliers.slice(startIndex, startIndex + this.itemsPerPage);
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  prevPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  resetForm(): void {
    this.isUpdateMode = false;
    this.isSubmitted = false;
    this.newSupplier = {
      id: undefined,
      name: '',
      contactName: '',
      email: '',
      phone: '',
      address: ''
    };
  }

  editSupplier(supplier: Supplier): void {
    this.isUpdateMode = true;
    this.isSubmitted = false;
    this.newSupplier = { ...supplier };

    setTimeout(() => {
      const formSection = document.querySelector('.form-section');
      if (formSection) {
        formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }, 0);
  }

  // Validations
  isValidName(): boolean {
    return !!this.newSupplier.name && this.newSupplier.name.trim() !== '';
  }

  isValidContactName(): boolean {
    return !!this.newSupplier.contactName && this.newSupplier.contactName.trim() !== '';
  }

  isValidEmail(): boolean {
    if (!this.newSupplier.email || this.newSupplier.email.trim() === '') return true;
    return /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/.test(this.newSupplier.email);
  }

  isValidPhone(): boolean {
    return /^07[01245678]\d{7}$/.test(this.newSupplier.phone.trim());
  }

  isValidAddress(): boolean {
    return !!this.newSupplier.address && this.newSupplier.address.trim() !== '';
  }

  saveSupplier(): void {
    this.isSubmitted = true;

    if (
      !this.isValidName() ||
      !this.isValidContactName() ||
      !this.isValidEmail() ||
      !this.isValidPhone() ||
      !this.isValidAddress()
    ) return;

    const request$ = this.isUpdateMode
      ? this.supplierService.updateSupplier(this.newSupplier)
      : this.supplierService.saveSupplier(this.newSupplier);

    request$.subscribe({
      next: (res) => {
        if (res) {
          Swal.fire({
            title: this.isUpdateMode ? 'Updated!' : 'Saved!',
            icon: 'success',
            timer: 1500
          });
          this.resetForm();
          this.loadSuppliers();
        }
      },
      error: (err) => this.handleBackendError(err)
    });
  }

  deleteSupplier(id: number): void {
    Swal.fire({
      title: 'Are you sure?',
      text: 'Delete this supplier?',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#ef4444'
    }).then((result) => {
      if (result.isConfirmed) {
        this.supplierService.deleteSupplier(id).subscribe({
          next: () => {
            Swal.fire('Deleted!', '', 'success');
            this.loadSuppliers();
          },
          error: () => Swal.fire('Error!', 'Failed to delete supplier', 'error')
        });
      }
    });
  }

  handleBackendError(err: any): void {
    const msg =
      err.status === 400 && err.error
        ? typeof err.error === 'string'
          ? err.error
          : Object.values(err.error)[0]
        : 'An error occurred!';
    Swal.fire({ icon: 'error', title: 'Failed!', text: msg as string });
  }

  onSearch(): void {
    const text = this.searchText.toLowerCase();
    this.filteredSuppliers = this.suppliers.filter((s) =>
      (s.name && s.name.toLowerCase().includes(text)) ||
      (s.contactName && s.contactName.toLowerCase().includes(text)) ||
      (s.phone && s.phone.includes(text)) ||
      (s.email && s.email.toLowerCase().includes(text))
    );
    this.currentPage = 1;
    this.updatePagination();
  }
}