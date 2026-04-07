import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-customers-profile',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './customers-profile.html',
  styleUrl: './customers-profile.css',
})
export class CustomersProfile {
  @Input() customer: any = null;
  @Input() showModal: boolean = false;
  @Output() closeModal = new EventEmitter<void>();

  onClose() {
    this.closeModal.emit();
  }
}
