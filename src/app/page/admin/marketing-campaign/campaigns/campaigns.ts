import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CampaignService } from '../../../../services/campaign.service';
import { MarketingCampaignDto } from '../../../../models/campaign.model';
import { timeout } from 'rxjs';

@Component({
  selector: 'app-campaigns',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './campaigns.html',
  styleUrls: ['./campaigns.css'],
})
export class CampaignsComponent implements OnInit {
  // Data
  allCampaigns: MarketingCampaignDto[] = [];
  filteredCampaigns: MarketingCampaignDto[] = [];

  // UI State
  loading = false;
  showModal = false;
  modalMode: 'create' | 'edit' = 'create';
  activeFilter: string = 'all';
  activeChannel: string = 'all';
  searchQuery: string = '';

  // Forms
  campaignForm!: FormGroup;

  // Metrics
  metrics = {
    total: 0,
    sent: 0,
    scheduled: 0,
    draft: 0,
  };

  // Toast
  toast = {
    show: false,
    message: '',
    type: 'success' as 'success' | 'error' | 'info',
  };

  constructor(
    private readonly campaignService: CampaignService,
    private readonly fb: FormBuilder,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadCampaigns();
  }

  private initializeForm(): void {
    this.campaignForm = this.fb.group({
      id: [null],
      campaignName: ['', [Validators.required, Validators.minLength(3)]],
      channel: ['EMAIL', Validators.required],
      subject: ['', Validators.required],
      bodyTemplate: ['', Validators.required],
      segmentId: [null],
      abTestEnabled: [false],
      variantBBody: [''],
      scheduledAt: [''],
      status: ['DRAFT'],
    });
  }

  // ============== API CALLS ==============

  loadCampaigns(): void {
    this.loading = true;
    this.campaignService.getAll().pipe(timeout(10000)).subscribe({
      next: (campaigns: MarketingCampaignDto[]) => {
        this.allCampaigns = campaigns || [];
        console.log('Campaigns loaded:', this.allCampaigns);
        console.log('Campaign statuses:', this.allCampaigns.map(c => ({ name: c.campaignName, status: c.status })));
        this.updateMetrics();
        console.log('Updated metrics:', this.metrics);
        this.applyFilter();
        this.loading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        console.error('Failed to load campaigns:', err);
        this.loading = false;
        this.allCampaigns = [];
        this.filteredCampaigns = [];
        this.showToast('Failed to load campaigns', 'error');
        this.cdr.detectChanges();
      },
    });
  }

  submitForm(): void {
    if (this.campaignForm.invalid) return;

    const formData = this.campaignForm.value;
    const isEdit = this.modalMode === 'edit';
    const campaignId = formData.id;

    if (isEdit && campaignId) {
      const updateData = { ...formData };
      delete updateData.id;

      this.campaignService.update(campaignId, updateData).subscribe({
        next: () => {
          this.showToast('Campaign updated successfully', 'success');
          this.closeModal();
          this.loadCampaigns();
        },
        error: (err: any) => {
          console.error('Failed to update campaign:', err);
          this.showToast('Failed to update campaign', 'error');
        },
      });
    } else {
      const createData = { ...formData };
      delete createData.id;

      this.campaignService.create(createData).subscribe({
        next: () => {
          this.showToast('Campaign created successfully', 'success');
          this.closeModal();
          this.loadCampaigns();
        },
        error: (err: any) => {
          console.error('Failed to create campaign:', err);
          this.showToast('Failed to create campaign', 'error');
        },
      });
    }
  }

  send(campaignId: number): void {
    if (!confirm('Send this campaign now?')) return;

    this.campaignService.send(campaignId).subscribe({
      next: () => {
        this.showToast('Campaign sent successfully', 'success');
        this.loadCampaigns();
      },
      error: (err: any) => {
        console.error('Failed to send campaign:', err);
        this.showToast('Failed to send campaign', 'error');
      },
    });
  }

  cancel(campaignId: number): void {
    if (!confirm('Cancel this campaign?')) return;

    this.campaignService.cancel(campaignId).subscribe({
      next: () => {
        this.showToast('Campaign cancelled', 'success');
        this.loadCampaigns();
      },
      error: (err: any) => {
        console.error('Failed to cancel campaign:', err);
        this.showToast('Failed to cancel campaign', 'error');
      },
    });
  }

  delete(campaignId: number): void {
    if (!confirm('Delete this campaign permanently?')) return;

    this.campaignService.delete(campaignId).subscribe({
      next: () => {
        this.showToast('Campaign deleted', 'success');
        this.loadCampaigns();
      },
      error: (err: any) => {
        console.error('Failed to delete campaign:', err);
        this.showToast('Failed to delete campaign', 'error');
      },
    });
  }

  // ============== UI METHODS ==============

  openCreateModal(): void {
    this.modalMode = 'create';
    this.campaignForm.reset({
      id: null,
      campaignName: '',
      channel: 'EMAIL',
      subject: '',
      bodyTemplate: '',
      segmentId: null,
      abTestEnabled: false,
      variantBBody: '',
      scheduledAt: '',
      status: 'DRAFT',
    });
    this.showModal = true;
  }

  openEditModal(campaign: MarketingCampaignDto): void {
    this.modalMode = 'edit';
    this.campaignForm.patchValue({
      id: campaign.id,
      campaignName: campaign.campaignName,
      channel: campaign.channel,
      subject: campaign.subject,
      bodyTemplate: campaign.bodyTemplate,
      segmentId: campaign.segmentId,
      abTestEnabled: campaign.abTestEnabled,
      variantBBody: campaign.variantBBody,
      scheduledAt: campaign.scheduledAt,
      status: campaign.status,
    });
    this.showModal = true;
  }

  closeModal(): void {
    this.showModal = false;
    this.campaignForm.reset();
  }

  setFilter(status: string): void {
    this.activeFilter = status;
    this.applyFilter();
  }

  setChannelFilter(channel: string): void {
    this.activeChannel = channel;
    console.log(`Channel filter set to: ${channel}`);
    this.applyFilter();
  }

  onSearch(query: string): void {
    this.searchQuery = query.toLowerCase();
    this.applyFilter();
  }

  private applyFilter(): void {
    let campaigns = this.allCampaigns;

    // Filter by status
    if (this.activeFilter !== 'all') {
      campaigns = campaigns.filter(
        (c) => (c.status || 'DRAFT').toUpperCase() === this.activeFilter.toUpperCase()
      );
    }

    // Filter by channel (with case-insensitive and default value handling)
    if (this.activeChannel !== 'all') {
      campaigns = campaigns.filter((c) => {
        const campaignChannel = (c.channel || 'EMAIL').toUpperCase().trim();
        return campaignChannel === this.activeChannel.toUpperCase();
      });
    }

    // Search by name or subject
    if (this.searchQuery) {
      campaigns = campaigns.filter(
        (c) =>
          c.campaignName.toLowerCase().includes(this.searchQuery) ||
          c.subject?.toLowerCase().includes(this.searchQuery)
      );
    }

    this.filteredCampaigns = campaigns;
    
    // Log filter results for debugging
    console.log('Filter applied:', {
      status: this.activeFilter,
      channel: this.activeChannel,
      search: this.searchQuery,
      resultCount: campaigns.length,
      campaigns: campaigns.map(c => ({
        name: c.campaignName,
        channel: c.channel || 'EMAIL',
        status: c.status || 'DRAFT'
      }))
    });
    
    this.cdr.detectChanges();
  }

  private updateMetrics(): void {
    this.metrics.total = this.allCampaigns.length;
    this.metrics.sent = this.countByStatus('SENT');
    this.metrics.scheduled = this.countByStatus('SCHEDULED');
    this.metrics.draft = this.countByStatus('DRAFT', true); // true = include campaigns with no status
    
    console.log('✅ Metrics Updated:', {
      total: this.metrics.total,
      sent: this.metrics.sent,
      scheduled: this.metrics.scheduled,
      draft: this.metrics.draft,
    });
    
    // Debug: Show campaign breakdown
    console.log('📊 Campaign Status Breakdown:', this.allCampaigns.map(c => ({
      campaignName: c.campaignName,
      status: c.status || 'DRAFT',
      channel: c.channel || 'EMAIL'
    })));
  }

  /**
   * Count campaigns by status
   * @param status - The status to count (SENT, SCHEDULED, DRAFT)
   * @param includeNull - If true, also count campaigns with no status (for DRAFT count)
   */
  private countByStatus(status: string, includeNull: boolean = false): number {
    return this.allCampaigns.filter((campaign) => {
      // Normalize the campaign status to uppercase
      const campaignStatus = (campaign.status || '').toUpperCase().trim();
      
      // If includeNull is true and campaign has no status, include it
      if (includeNull && !campaign.status) {
        return true;
      }
      
      // Otherwise, match the status exactly (case-insensitive)
      return campaignStatus === status.toUpperCase();
    }).length;
  }

  /**
   * Get count of SENT campaigns
   */
  countSent(): number {
    return this.metrics.sent;
  }

  /**
   * Get count of SCHEDULED campaigns
   */
  countScheduled(): number {
    return this.metrics.scheduled;
  }

  /**
   * Get count of DRAFT campaigns
   */
  countDraft(): number {
    return this.metrics.draft;
  }

  private showToast(message: string, type: 'success' | 'error' | 'info'): void {
    this.toast = {
      show: true,
      message,
      type,
    };
    this.cdr.detectChanges();

    setTimeout(() => {
      this.toast.show = false;
      this.cdr.detectChanges();
    }, 3000);
  }
}
