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
  scheduleForm!: FormGroup;

  // Schedule Modal State
  showScheduleModal = false;
  scheduleModalCampaign: MarketingCampaignDto | null = null;

  // Confirmation Modal State
  showConfirmModal = false;
  confirmModalCampaign: MarketingCampaignDto | null = null;
  confirmAction: 'schedule' | 'send' | 'cancel' | 'delete' | null = null;

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

  // Track in-flight send to lock other send buttons
  sendingCampaignId: number | null = null;

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

    this.scheduleForm = this.fb.group({
      scheduledAt: ['', Validators.required],
    });
  }

  // ============== API CALLS ==============

  loadCampaigns(): void {
    this.loading = true;
    this.campaignService.getAll().pipe(timeout(10000)).subscribe({
      next: (campaigns: MarketingCampaignDto[]) => {
        this.allCampaigns = campaigns || [];
        this.updateMetrics();
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

    // Auto-set status to SCHEDULED if scheduledAt is set
    if (formData.scheduledAt?.trim()) {
      formData.status = 'SCHEDULED';
    }

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
    if (this.sendingCampaignId) return;
    const campaign = this.allCampaigns.find(c => c.id === campaignId);
    if (campaign) {
      this.confirmModalCampaign = campaign;
      this.confirmAction = 'send';
      this.showConfirmModal = true;
      this.cdr.detectChanges();
    }
  }

  executeSend(campaignId: number): void {
    if (this.sendingCampaignId) return;

    this.sendingCampaignId = campaignId;
    this.cdr.detectChanges();

    this.campaignService.send(campaignId).subscribe({
      next: () => {
        this.showToast('Campaign sent successfully', 'success');
        this.updateSentTimestamp(campaignId);
        this.campaignService.getAll().pipe(timeout(10000)).subscribe({
          next: (campaigns) => {
            this.allCampaigns = campaigns || [];
            this.updateMetrics();
            this.applyFilter();
            this.sendingCampaignId = null;
            this.cdr.detectChanges();
          },
          error: () => {
            this.sendingCampaignId = null;
            this.cdr.detectChanges();
          },
        });
      },
      error: (err: any) => {
        if (err.status === 200 || err.status === 0) {
          this.showToast('Campaign sent successfully', 'success');
          this.updateSentTimestamp(campaignId);
          this.campaignService.getAll().pipe(timeout(10000)).subscribe({
            next: (campaigns) => {
              this.allCampaigns = campaigns || [];
              this.updateMetrics();
              this.applyFilter();
              this.sendingCampaignId = null;
              this.cdr.detectChanges();
            },
            error: () => {
              this.sendingCampaignId = null;
              this.cdr.detectChanges();
            },
          });
        } else {
          console.error('Send failed:', err?.status, err?.message);
          this.showToast('Failed to send campaign', 'error');
          this.sendingCampaignId = null;
          this.cdr.detectChanges();
        }
      },
    });
  }

  cancel(campaignId: number): void {
    const campaign = this.allCampaigns.find(c => c.id === campaignId);
    if (campaign) {
      this.confirmModalCampaign = campaign;
      this.confirmAction = 'cancel';
      this.showConfirmModal = true;
      this.cdr.detectChanges();
    }
  }

  executeCancel(campaignId: number): void {
    this.campaignService.cancel(campaignId).subscribe({
      next: () => {
        this.showToast('Campaign cancelled', 'success');
        this.markCancelled(campaignId);
        this.loadCampaigns();
      },
      error: (err: any) => {
        if (err.status === 200 || err.status === 0) {
          this.showToast('Campaign cancelled', 'success');
          this.markCancelled(campaignId);
          this.campaignService.getAll().pipe(timeout(10000)).subscribe({
            next: (campaigns) => {
              this.allCampaigns = campaigns || [];
              this.updateMetrics();
              this.applyFilter();
              this.cdr.detectChanges();
            },
            error: () => {
              this.cdr.detectChanges();
            },
          });
        } else {
          console.error('Cancel failed:', err?.status, err?.message);
          this.showToast('Failed to cancel campaign', 'error');
        }
      },
    });
  }

openScheduleModal(campaign: MarketingCampaignDto): void {
    this.scheduleModalCampaign = campaign;
    const existing = campaign.scheduledAt
      ? new Date(campaign.scheduledAt).toISOString().slice(0, 16)
      : '';
    this.scheduleForm.patchValue({ scheduledAt: existing });
    this.showScheduleModal = true;
  }

  closeScheduleModal(): void {
    this.showScheduleModal = false;
    this.scheduleModalCampaign = null;
    this.scheduleForm.reset();
  }

  submitScheduleForm(): void {
    if (this.scheduleForm.invalid || !this.scheduleModalCampaign) return;

    const scheduledAt = this.scheduleForm.get('scheduledAt')?.value;
    if (!scheduledAt) return;

    // Convert to full ISO format without Z (YYYY-MM-DDTHH:MM:SS)
    let isoDateTime: string;
    if (scheduledAt.includes(':')) {
      isoDateTime = scheduledAt.length === 16 ? scheduledAt + ':00' : scheduledAt;
    } else {
      isoDateTime = scheduledAt;
    }

    this.campaignService.schedule(this.scheduleModalCampaign.id!, isoDateTime).subscribe({
      next: () => {
        this.showToast('Campaign scheduled successfully', 'success');
        this.markScheduled(this.scheduleModalCampaign!.id!, isoDateTime);
        this.closeScheduleModal();
        this.loadCampaigns();
      },
      error: (err: any) => {
        // Treat HTTP 200 as success even if HttpClient throws error
        if (err.status === 200 || err.status === 0) {
          this.showToast('Campaign scheduled successfully', 'success');
          this.markScheduled(this.scheduleModalCampaign!.id!, isoDateTime);
          this.closeScheduleModal();
          this.campaignService.getAll().pipe(timeout(10000)).subscribe({
            next: (campaigns) => {
              this.allCampaigns = campaigns || [];
              this.updateMetrics();
              this.applyFilter();
              this.cdr.detectChanges();
            },
            error: () => {
              this.cdr.detectChanges();
            },
          });
        } else {
          console.error('Failed to schedule campaign:', err, err.status, err.error);
          this.showToast('Failed to schedule campaign', 'error');
        }
      },
    });
  }

  delete(campaignId: number): void {
    const campaign = this.allCampaigns.find(c => c.id === campaignId);
    if (campaign) {
      this.confirmModalCampaign = campaign;
      this.confirmAction = 'delete';
      this.showConfirmModal = true;
      this.cdr.detectChanges();
    }
  }

  executeDelete(campaignId: number): void {
    this.campaignService.delete(campaignId).subscribe({
      next: () => {
        this.showToast('Campaign deleted', 'success');
        this.removeCampaign(campaignId);
        this.loadCampaigns();
      },
      error: (err: any) => {
        if (err.status === 200 || err.status === 0) {
          this.showToast('Campaign deleted', 'success');
          this.removeCampaign(campaignId);
          this.campaignService.getAll().pipe(timeout(10000)).subscribe({
            next: (campaigns) => {
              this.allCampaigns = campaigns || [];
              this.updateMetrics();
              this.applyFilter();
              this.cdr.detectChanges();
            },
            error: () => {
              this.cdr.detectChanges();
            },
          });
        } else {
          console.error('Delete failed:', err?.status, err?.message);
          this.showToast('Failed to delete campaign', 'error');
        }
      },
    });
  }

  // Status helpers keep template conditions case-insensitive
  isDraft(campaign: MarketingCampaignDto): boolean {
    return (campaign.status || 'DRAFT').toUpperCase().trim() === 'DRAFT';
  }

  isScheduled(campaign: MarketingCampaignDto): boolean {
    return (campaign.status || '').toUpperCase().trim() === 'SCHEDULED';
  }

  schedule(campaign: MarketingCampaignDto): void {
    this.confirmModalCampaign = campaign;
    this.confirmAction = 'schedule';
    this.showConfirmModal = true;
    this.cdr.detectChanges();
  }

  closeConfirmModal(): void {
    this.showConfirmModal = false;
    this.confirmModalCampaign = null;
    this.confirmAction = null;
  }

  confirmActionHandler(): void {
    if (!this.confirmModalCampaign || !this.confirmAction) {
      return;
    }
    const campaignId = this.confirmModalCampaign.id!;
    const action = this.confirmAction;
    const campaign = this.confirmModalCampaign;
    this.closeConfirmModal();

    if (action === 'schedule') {
      this.openScheduleModal(campaign);
    } else if (action === 'send') {
      this.executeSend(campaignId);
    } else if (action === 'cancel') {
      this.executeCancel(campaignId);
    } else if (action === 'delete') {
      this.executeDelete(campaignId);
    }
  }

  getConfirmMessage(): string {
    switch (this.confirmAction) {
      case 'send':
        return 'Send this campaign now?';
      case 'cancel':
        return 'Cancel this campaign?';
      case 'delete':
        return 'Delete this campaign permanently?';
      case 'schedule':
        return 'Do you want to schedule this campaign?';
      default:
        return 'Confirm action?';
    }
  }

  getConfirmButtonText(): string {
    switch (this.confirmAction) {
      case 'send':
        return 'Yes, Send';
      case 'cancel':
        return 'Yes, Cancel';
      case 'delete':
        return 'Yes, Delete';
      case 'schedule':
        return 'Yes, Schedule';
      default:
        return 'Confirm';
    }
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
    this.cdr.detectChanges();
  }

  private updateMetrics(): void {
    this.metrics.total = this.allCampaigns.length;
    this.metrics.sent = this.countByStatus('SENT');
    this.metrics.scheduled = this.countByStatus('SCHEDULED');
    this.metrics.draft = this.countByStatus('DRAFT', true); // true = include campaigns with no status
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

  /** Optimistically stamp sent time/status so the table updates immediately */
  private updateSentTimestamp(campaignId: number): void {
    const nowIso = new Date().toISOString();

    this.updateLocalCampaign(campaignId, (c) => ({ ...c, sentAt: nowIso, status: 'SENT' }));
  }

  /** Optimistically mark scheduled */
  private markScheduled(campaignId: number, scheduledAt: string): void {
    this.updateLocalCampaign(campaignId, (c) => ({
      ...c,
      scheduledAt,
      status: 'SCHEDULED',
    }));
  }

  /** Optimistically mark cancelled */
  private markCancelled(campaignId: number): void {
    this.updateLocalCampaign(campaignId, (c) => ({
      ...c,
      status: 'CANCELLED',
    }));
  }

  /** Remove locally so UI updates immediately */
  private removeCampaign(campaignId: number): void {
    this.allCampaigns = this.allCampaigns.filter((c) => c.id !== campaignId);
    this.applyFilter();
    this.updateMetrics();
  }

  /** Shared helper for optimistic updates */
  private updateLocalCampaign(
    campaignId: number,
    updater: (c: MarketingCampaignDto) => MarketingCampaignDto
  ): void {
    this.allCampaigns = this.allCampaigns.map((c) =>
      c.id === campaignId ? updater(c) : c
    );
    this.applyFilter();
    this.updateMetrics();
  }

  isSending(campaignId: number): boolean {
    return this.sendingCampaignId === campaignId;
  }

  sendDisabledFor(campaignId: number): boolean {
    return !!this.sendingCampaignId && this.sendingCampaignId !== campaignId;
  }

}
