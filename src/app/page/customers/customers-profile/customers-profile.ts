import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface VisitHistory {
  visitDate: string;
  orderNumber: string;
  orderType: string;
  spendAmount: number;
  status: string;
  notes: string;
}

interface CustomerProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  birthday?: string;
  preferredLanguage: string;
  dietaryNotes?: string;
  communicationEmail: number;
  communicationSms: number;
  loyaltyPoints: number;
  recentVisits?: VisitHistory[];
}

@Component({
  selector: 'app-customers-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customers-profile.html',
  styleUrl: './customers-profile.css',
})
export class CustomersProfile implements OnInit, OnChanges {
  @Input() customer: any = null;
  @Input() showModal: boolean = false;
  @Output() closeModal = new EventEmitter<void>();

  profile: CustomerProfile | null = null;
  dataSource: VisitHistory[] = [];
  displayedColumns: string[] = ['visitDate', 'orderNumber', 'orderType', 'spendAmount', 'status', 'notes'];

  isLoading = false;
  errorMessage = '';

  constructor(
    private http: HttpClient,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    // Initialize if needed
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showModal'] && this.showModal && this.customer?.id) {
      this.loadFullProfile(this.customer.id);
    }
  }

  loadFullProfile(customerId: number): void {
    this.errorMessage = '';
    this.profile = null;

    this.http.get<CustomerProfile>(`http://localhost:8080/customers/${customerId}/profile`).subscribe({
      next: (data: CustomerProfile) => {
        this.profile = data;
        this.dataSource = data.recentVisits || [];
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Error loading profile:', err);
        this.errorMessage = 'ප්‍රොෆයිල් ලබාගැනීමට නොහැකි විය. කරුණාකර නැවත උත්සාහ කරන්න.';
        this.cdr.detectChanges();
      }
    });
  }

  onClose() {
    this.closeModal.emit();
    // Modal close කළාට පස්සේ data clear කරන්න
    this.profile = null;
    this.dataSource = [];
    this.errorMessage = '';
  }
}
