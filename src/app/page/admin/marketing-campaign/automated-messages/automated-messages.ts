import { CommonModule } from '@angular/common';
import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { timeout } from 'rxjs';
import { AutomatedMessageService } from '../../../../services/automated-message.service';
import { AutomatedMessage, OfferType, SendEmailRequest, TriggerType } from '../../../../models/automated-message.model';
import { EmailSchedulerService } from '../../../../services/email-scheduler.service';
import { EmailSchedulerConfig } from '../../../../models/email-scheduler.model';

type TriggerFilter = TriggerType | 'all';
type StatusFilter = 'all' | 'inactive';
type ToastType = 'success' | 'error' | 'info';

@Component({
	selector: 'app-automated-messages',
	standalone: true,
	imports: [CommonModule, ReactiveFormsModule],
	templateUrl: './automated-messages.html',
	styleUrls: ['./automated-messages.css'],
	changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutomatedMessagesComponent implements OnInit {
	private readonly pageSize = 6;

	isLoading = false;
	showModal = false;
	showTestModal = false;
	showDebugModal = false;
	showSchedulePanel = false;
	modalMode: 'create' | 'edit' = 'create';
	activeTriggerFilter: TriggerFilter = 'all';
	statusFilter: StatusFilter = 'all';
	currentPage = 1;
	totalPages = 1;
	schedulerLoading = false;

	metrics = {
		active: 0,
		birthday: 0,
		anniversary: 0,
		lapsed: 0,
	};

	toast = {
		show: false,
		message: '',
		type: 'success' as ToastType,
	};

	triggerTypes: TriggerType[] = ['BIRTHDAY', 'ANNIVERSARY', 'LAPSED', 'TIER_CHANGE'];
	offerTypes: OfferType[] = ['DISCOUNT', 'FREE_ITEM', 'NONE'];

	messages: AutomatedMessage[] = [];
	filteredMessages: AutomatedMessage[] = [];
	paginatedMessages: AutomatedMessage[] = [];
	debugData: any = null;

	messageForm!: FormGroup;
	bulkForm!: FormGroup;
	testEmailForm!: FormGroup;
	emailSchedulerForm!: FormGroup;

	constructor(
		private readonly automatedMessageService: AutomatedMessageService,
		private readonly emailSchedulerService: EmailSchedulerService,
		private readonly fb: FormBuilder,
		private readonly cdr: ChangeDetectorRef
	) {}

	ngOnInit(): void {
		this.initializeForms();
		this.loadMessages();
	}

	private initializeForms(): void {
		this.messageForm = this.fb.group({
			id: [null],
			triggerType: ['', Validators.required],
			channel: ['EMAIL', Validators.required],
			templateBody: ['', [Validators.required, Validators.minLength(10)]],
			offerType: ['NONE'],
			offerValue: [null],
			sendDaysBefore: [0],
			isActive: [true],
		});

		this.bulkForm = this.fb.group({
			subject: ['', Validators.required],
			message: ['', [Validators.required, Validators.minLength(3)]],
			recipientType: ['ALL'],
		});

		this.testEmailForm = this.fb.group({
			toEmail: ['', [Validators.required, Validators.email]],
		});

		this.emailSchedulerForm = this.fb.group({
			sendTime: ['', Validators.required],
		});
	}

	// ============== Data Loading ==============

	loadMessages(): void {
		this.isLoading = true;
		this.automatedMessageService
			.getAll()
			.pipe(timeout(10000))
			.subscribe({
				next: (res: AutomatedMessage[]) => {
					this.messages = res || [];
					this.computeMetrics(this.messages);
					this.applyFilter();
					this.isLoading = false;
					this.cdr.detectChanges();
				},
				error: (err: any) => {
					console.error('Failed to load automated messages', err);
					this.messages = [];
					this.filteredMessages = [];
					this.paginatedMessages = [];
					this.isLoading = false;
					this.showToast('Failed to load automated messages', 'error');
					this.cdr.detectChanges();
				},
			});
	}

	loadInactiveMessages(): void {
		this.isLoading = true;
		this.automatedMessageService
			.getInactive()
			.pipe(timeout(10000))
			.subscribe({
				next: (res: AutomatedMessage[]) => {
					this.messages = res || [];
					this.computeMetrics(this.messages);
					this.applyFilter();
					this.isLoading = false;
					this.cdr.detectChanges();
				},
				error: (err: any) => {
					console.error('Failed to load inactive messages', err);
					this.messages = [];
					this.filteredMessages = [];
					this.paginatedMessages = [];
					this.isLoading = false;
					this.showToast('Failed to load inactive messages', 'error');
					this.cdr.detectChanges();
				},
			});
	}

	// ============== Filters & Pagination ==============

	setTriggerFilter(trigger: TriggerFilter): void {
		this.activeTriggerFilter = trigger;
		this.currentPage = 1;
		this.applyFilter();
	}

	setStatusFilter(filter: StatusFilter): void {
		if (this.statusFilter === filter) return;

		this.statusFilter = filter;
		this.currentPage = 1;

		if (filter === 'inactive') {
			this.loadInactiveMessages();
		} else {
			this.loadMessages();
		}
	}

	private applyFilter(): void {
		const base = this.messages || [];

		this.filteredMessages =
			this.activeTriggerFilter === 'all'
				? base
				: base.filter((m) => (m.triggerType || '').toUpperCase() === this.activeTriggerFilter.toUpperCase());

		this.updatePagination();
	}

	private updatePagination(): void {
		this.totalPages = Math.max(1, Math.ceil(this.filteredMessages.length / this.pageSize));
		this.currentPage = Math.min(this.currentPage, this.totalPages);

		const start = (this.currentPage - 1) * this.pageSize;
		const end = start + this.pageSize;
		this.paginatedMessages = this.filteredMessages.slice(start, end);

		this.cdr.detectChanges();
	}

	nextPage(): void {
		if (this.currentPage < this.totalPages) {
			this.currentPage += 1;
			this.updatePagination();
		}
	}

	previousPage(): void {
		if (this.currentPage > 1) {
			this.currentPage -= 1;
			this.updatePagination();
		}
	}

	private computeMetrics(data: AutomatedMessage[]): void {
		this.metrics = {
			active: data.filter((m) => !!m.isActive).length,
			birthday: data.filter((m) => m.triggerType === 'BIRTHDAY').length,
			anniversary: data.filter((m) => m.triggerType === 'ANNIVERSARY').length,
			lapsed: data.filter((m) => m.triggerType === 'LAPSED').length,
		};
	}

	// ============== CRUD ==============

	openCreateModal(): void {
		this.modalMode = 'create';
		this.showModal = true;
		this.messageForm.reset({
			id: null,
			triggerType: '',
			channel: 'EMAIL',
			templateBody: '',
			offerType: 'NONE',
			offerValue: null,
			sendDaysBefore: 0,
			isActive: true,
		});
	}

	openEditModal(message: AutomatedMessage): void {
		this.modalMode = 'edit';
		this.showModal = true;
		this.messageForm.patchValue({
			id: message.id ?? null,
			triggerType: message.triggerType,
			channel: message.channel,
			templateBody: message.templateBody,
			offerType: message.offerType ?? 'NONE',
			offerValue: message.offerValue ?? null,
			sendDaysBefore: message.sendDaysBefore ?? 0,
			isActive: message.isActive ?? true,
		});
		this.cdr.detectChanges();
	}

	closeModal(): void {
		this.showModal = false;
		this.messageForm.reset();
	}

	// ============== Email Scheduler ==============

	openSchedulePanel(): void {
		this.showSchedulePanel = true;
		this.loadEmailSchedulerConfig();
	}

	closeSchedulePanel(): void {
		this.showSchedulePanel = false;
		this.emailSchedulerForm.reset({
			sendTime: '',
		});
	}

	loadEmailSchedulerConfig(): void {
		this.schedulerLoading = true;
		this.emailSchedulerService.getConfig().subscribe({
			next: (config: EmailSchedulerConfig) => {
				this.emailSchedulerForm.patchValue({
					sendTime: config.sendTime || '',
				});
				this.schedulerLoading = false;
				this.cdr.detectChanges();
			},
			error: (err: any) => {
				console.error('Failed to load email scheduler config', err);
				this.schedulerLoading = false;
				this.showToast('Failed to load email scheduler config', 'error');
				this.cdr.detectChanges();
			},
		});
	}

	saveEmailScheduler(): void {
		if (this.emailSchedulerForm.invalid) return;

		const payload: EmailSchedulerConfig = this.emailSchedulerForm.value;

		this.emailSchedulerService.updateConfig(payload).subscribe({
			next: () => {
				this.showToast('Email scheduler saved successfully', 'success');
				this.closeSchedulePanel();
			},
			error: (err: any) => {
				console.error('Failed to save email scheduler config', err);
				this.showToast('Failed to save email scheduler config', 'error');
			},
		});
	}

	setQuickTime(time: string): void {
		this.emailSchedulerForm.patchValue({ sendTime: time });
	}

	submitMessage(): void {
		if (this.messageForm.invalid) return;

		const formValue = { ...this.messageForm.value } as AutomatedMessage;
		const payload: AutomatedMessage = {
			triggerType: formValue.triggerType,
			channel: formValue.channel,
			templateBody: formValue.templateBody,
			offerType: formValue.offerType,
			offerValue: formValue.offerValue,
			sendDaysBefore: formValue.sendDaysBefore,
			isActive: formValue.isActive,
		};

		if (this.modalMode === 'edit' && formValue.id) {
			this.automatedMessageService.update(formValue.id, payload).subscribe({
				next: () => {
					this.showToast('Message updated', 'success');
					this.closeModal();
					this.refreshByStatus();
				},
				error: (err: any) => {
					console.error('Failed to update message', err);
					this.showToast('Failed to update message', 'error');
				},
			});
		} else {
			this.automatedMessageService.create(payload).subscribe({
				next: () => {
					this.showToast('Message created', 'success');
					this.closeModal();
					this.refreshByStatus();
				},
				error: (err: any) => {
					console.error('Failed to create message', err);
					this.showToast('Failed to create message', 'error');
				},
			});
		}
	}

	toggle(message: AutomatedMessage): void {
		if (!message.id) return;

		this.automatedMessageService.toggleStatus(message.id).subscribe({
			next: () => {
				this.showToast('Message status updated', 'success');
				this.refreshByStatus();
			},
			error: (err: any) => {
				console.error('Failed to toggle message', err);
				this.showToast('Failed to toggle message', 'error');
			},
		});
	}

	delete(id?: number): void {
		if (!id) return;
		if (!confirm('Delete this automated message?')) return;

		this.automatedMessageService.delete(id).subscribe({
			next: () => {
				this.showToast('Message deleted', 'success');
				this.refreshByStatus();
			},
			error: (err: any) => {
				console.error('Failed to delete message', err);
				this.showToast('Failed to delete message', 'error');
			},
		});
	}

	private refreshByStatus(): void {
		if (this.statusFilter === 'inactive') {
			this.loadInactiveMessages();
		} else {
			this.loadMessages();
		}
	}

	// ============== Bulk & Test Actions ==============

	sendToAll(): void {
		if (this.bulkForm.invalid) return;
		const req = this.bulkForm.value as SendEmailRequest;

		this.automatedMessageService.sendToAll(req).subscribe({
			next: () => this.showToast('Sent to all customers', 'success'),
			error: (err: any) => {
				console.error('Failed to send to all', err);
				this.showToast('Failed to send to all', 'error');
			},
		});
	}

	sendBirthday(): void {
		if (this.bulkForm.invalid) return;
		const req = this.bulkForm.value as SendEmailRequest;

		this.automatedMessageService.sendBirthday(req).subscribe({
			next: () => this.showToast('Birthday messages queued', 'success'),
			error: (err: any) => {
				console.error('Failed to send birthday messages', err);
				this.showToast('Failed to send birthday messages', 'error');
			},
		});
	}

	sendAnniversary(): void {
		if (this.bulkForm.invalid) return;
		const req = this.bulkForm.value as SendEmailRequest;

		this.automatedMessageService.sendAnniversary(req).subscribe({
			next: () => this.showToast('Anniversary messages queued', 'success'),
			error: (err: any) => {
				console.error('Failed to send anniversary messages', err);
				this.showToast('Failed to send anniversary messages', 'error');
			},
		});
	}

	sendTestEmail(): void {
		if (this.testEmailForm.invalid) return;
		const toEmail = this.testEmailForm.value.toEmail as string;

		this.automatedMessageService.sendTestEmail(toEmail).subscribe({
			next: () => {
				this.showToast('Test email sent', 'success');
				this.showTestModal = false;
			},
			error: (err: any) => {
				console.error('Failed to send test email', err);
				this.showToast('Failed to send test email', 'error');
			},
		});
	}

	// ============== Debug ==============

	openDebugModal(): void {
		this.showDebugModal = true;
		this.debugData = null;

		this.automatedMessageService.debugCustomerStatus().subscribe({
			next: (data: any) => {
				this.debugData = data;
				this.cdr.detectChanges();
			},
			error: (err: any) => {
				console.error('Failed to load debug data', err);
				this.showToast('Failed to load debug data', 'error');
			},
		});
	}

	closeDebugModal(): void {
		this.showDebugModal = false;
		this.debugData = null;
	}

	// ============== Toast ==============

	private showToast(message: string, type: ToastType): void {
		this.toast = { show: true, message, type };
		this.cdr.detectChanges();

		setTimeout(() => {
			this.toast.show = false;
			this.cdr.detectChanges();
		}, 2500);
	}
}
