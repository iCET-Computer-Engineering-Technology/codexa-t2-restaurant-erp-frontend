import { Component, OnInit, OnChanges, SimpleChanges, Input, Output, EventEmitter } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
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
  loyaltyPoints: number;
  lifetimeSpend: number;
  recentVisits?: VisitHistory[];
}

@Component({
  selector: 'app-customers-profile',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="customer-profile"><p>{{ profile?.firstName }} {{ profile?.lastName }}</p></div>',
  styles: []
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
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) { }

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    const customerId = idParam ? +idParam : null;

    if (customerId && customerId > 0) {
      this.loadFullProfile(customerId);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['showModal'] && this.showModal && this.customer?.id) {
      this.loadFullProfile(this.customer.id);
    }
  }

  loadFullProfile(customerId: number): void {
    this.isLoading = true;
    this.errorMessage = '';
    this.profile = null;

    this.http.get<CustomerProfile>(`http://localhost:8080/customers/${customerId}`).subscribe({
      next: (data: CustomerProfile) => {
        this.profile = data;
        this.dataSource = data.recentVisits || [];
        this.isLoading = false;
      },
      error: (err: any) => {
        console.error('Error loading profile:', err);
        this.errorMessage = 'ප්‍රොෆයිල් ලබාගැනීමට නොහැකි විය. නැවත උත්සාහ කරන්න.';
        this.isLoading = false;
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

  goBack(): void {
    this.router.navigate(['/admin/admin-customer']);
  }
}
