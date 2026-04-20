import { Component, computed, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReceiptService } from '../../services/receipt.service';
import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import {
  ReceiptDTO,
  ReceiptViewMode,
  calculateFinancialBreakdown,
  FinancialBreakdown,
} from '../../models/receipt.model';

@Component({
  selector: 'app-receipts',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './receipts.component.html',
  styleUrls: ['./receipts.component.css'],
})
export class ReceiptsComponent implements OnInit {
  // Data state
  readonly receipts = signal<ReceiptDTO[]>([]);
  readonly isLoading = signal<boolean>(false);
  readonly error = signal<string | null>(null);

  // View state
  readonly viewMode = signal<ReceiptViewMode>('list');
  readonly selectedReceipt = signal<ReceiptDTO | null>(null);

  // Filter/Search state
  readonly searchOrderNumber = signal<string>('');
  readonly filterStartDate = signal<string>('');
  readonly filterEndDate = signal<string>('');

  // Pagination state
  readonly currentPage = signal<number>(1);
  readonly itemsPerPage = signal<number>(10);

  readonly isDownloadingPdf = signal<boolean>(false);

  // Computed
  readonly hasReceipts = computed(() => this.receipts().length > 0);
  readonly hasError = computed(() => !!this.error());
  readonly hasFiltersApplied = computed(() => {
    return (
      this.searchOrderNumber().trim() !== '' ||
      this.filterStartDate() !== '' ||
      this.filterEndDate() !== ''
    );
  });

  readonly filteredReceipts = computed(() => {
    const all = this.receipts();
    const searchTerm = this.searchOrderNumber().toLowerCase().trim();
    const startDateStr = this.filterStartDate();
    const endDateStr = this.filterEndDate();

    return all.filter((receipt) => {
      // Search by order number
      if (searchTerm && !receipt.orderNumber.toLowerCase().includes(searchTerm)) {
        return false;
      }

      // Filter by date range
      if (startDateStr || endDateStr) {
        const receiptDate = new Date(receipt.createdAt);
        const startDate = startDateStr ? new Date(startDateStr) : null;
        const endDate = endDateStr ? new Date(endDateStr) : null;

        if (startDate && receiptDate < startDate) return false;
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          if (receiptDate > endOfDay) return false;
        }
      }

      return true;
    });
  });

  readonly paginatedReceipts = computed(() => {
    const filtered = this.filteredReceipts();
    const page = this.currentPage();
    const perPage = this.itemsPerPage();
    const start = (page - 1) * perPage;
    const end = start + perPage;
    return filtered.slice(start, end);
  });

  readonly totalPages = computed(() => {
    const filtered = this.filteredReceipts();
    const perPage = this.itemsPerPage();
    return Math.ceil(filtered.length / perPage) || 1;
  });

  readonly resultCount = computed(() => this.filteredReceipts().length);

  // Selected receipt computed properties
  readonly selectedReceiptFinancials = computed(() => {
    const receipt = this.selectedReceipt();
    return receipt ? calculateFinancialBreakdown(receipt) : null;
  });

  constructor(private receiptService: ReceiptService) {}

  ngOnInit(): void {
    this.loadReceipts();
  }

  //Load all receipts from API
  loadReceipts(): void {
    this.isLoading.set(true);
    this.error.set(null);

    this.receiptService.getAllReceipts().subscribe({
      next: (receipts) => {
        this.receipts.set(receipts);
        this.isLoading.set(false);
        this.currentPage.set(1);
      },
      error: (err) => {
        console.error('Error loading receipts:', err);
        console.error('Error status:', err.status);
        console.error('Error message:', err.message);
        console.error('Error response:', err.error);
        
        let errorMessage = 'Failed to load receipts. Please try again.';
        if (err.status === 0) {
          errorMessage = 'Backend server is not running. Start the backend at http://localhost:8080';
        } else if (err.status === 404) {
          errorMessage = 'API endpoint not found. Check backend configuration.';
        } else if (err.status === 500) {
          errorMessage = 'Backend error. Check server logs.';
        }
        
        this.error.set(errorMessage);
        this.isLoading.set(false);
      },
    });
  }

  //Search and filter receipts
  applySearch(): void {
    this.currentPage.set(1);
    const startDate = this.filterStartDate() ? new Date(this.filterStartDate()) : undefined;
    const endDate = this.filterEndDate() ? new Date(this.filterEndDate()) : undefined;

    this.isLoading.set(true);
    this.error.set(null);

    this.receiptService
      .searchReceipts(this.searchOrderNumber(), startDate, endDate)
      .subscribe({
        next: (receipts) => {
          this.receipts.set(receipts);
          this.isLoading.set(false);
        },
        error: (err) => {
          this.error.set('Search failed. Please try again.');
          this.isLoading.set(false);
          console.error('Error searching receipts:', err);
        },
      });
  }

  //Clear all filters
  clearFilters(): void {
    this.searchOrderNumber.set('');
    this.filterStartDate.set('');
    this.filterEndDate.set('');
    this.currentPage.set(1);
    this.loadReceipts();
  }

  //Select a receipt to view details
  selectReceipt(receipt: ReceiptDTO): void {
    this.selectedReceipt.set(receipt);
    this.viewMode.set('detail');
  }

  //Go back to list view
  backToList(): void {
    this.viewMode.set('list');
    this.selectedReceipt.set(null);
  }

  //Print receipt
  printReceipt(): void {
    const receipt = this.selectedReceipt();
    if (!receipt) return;

    const printWindow = window.open('', '', 'height=600,width=800');
    if (!printWindow) {
      alert('Unable to open print window');
      return;
    }

    const html = this.generateReceiptHTML(receipt);
    printWindow.document.write(html);
    printWindow.document.close();

    setTimeout(() => {
      printWindow.print();
    }, 250);
  }

  // Download receipt as PDF
  async downloadReceiptPdf(): Promise<void> {
    const receipt = this.selectedReceipt();
    if (!receipt) return;

    if (this.isDownloadingPdf()) {
      return;
    }

    this.isDownloadingPdf.set(true);

    let wrapper: HTMLDivElement | null = null;

    try {
      const financials = calculateFinancialBreakdown(receipt);
      const receiptCss = this.getReceiptCssForInlineRender();
      const receiptMarkup = this.getReceiptMarkup(receipt, financials);

      wrapper = document.createElement('div');
      wrapper.setAttribute('data-receipt-render', '');
      wrapper.style.position = 'fixed';
      wrapper.style.left = '-10000px';
      wrapper.style.top = '0';
      wrapper.style.width = '210mm';
      wrapper.style.background = '#fff';
      wrapper.style.zIndex = '9999';

      const style = document.createElement('style');
      style.textContent = receiptCss;

      wrapper.appendChild(style);

      const content = document.createElement('div');
      content.innerHTML = receiptMarkup;
      wrapper.appendChild(content);

      document.body.appendChild(wrapper);

      const target = wrapper.querySelector('.receipt-container') as HTMLElement | null;
      if (!target) {
        throw new Error('Receipt render failed.');
      }

      const canvas = await html2canvas(target, {
        backgroundColor: '#ffffff',
        scale: 3,
        useCORS: true,
      });

      const imgData = canvas.toDataURL('image/jpeg', 0.95);

      const pdf = new jsPDF({
        orientation: 'p',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();

      const margin = 10; // mm
      const maxWidth = pageWidth - margin * 2;
      const maxHeight = pageHeight - margin * 2;

      // Fit within printable area; keep aspect ratio.
      let imgWidth = maxWidth;
      let imgHeight = (canvas.height * imgWidth) / canvas.width;
      if (imgHeight > maxHeight) {
        imgHeight = maxHeight;
        imgWidth = (canvas.width * imgHeight) / canvas.height;
      }

      const x = (pageWidth - imgWidth) / 2;
      const y = margin;

      pdf.addImage(imgData, 'JPEG', x, y, imgWidth, imgHeight);

      const fileSafeOrder = (receipt.orderNumber || `order-${receipt.orderId}`)
        .toString()
        .replace(/[^a-z0-9-_]+/gi, '_');

      pdf.save(`receipt-${fileSafeOrder}.pdf`);
    } catch (err) {
      console.error('Failed to download receipt PDF:', err);
      alert('Failed to download receipt as PDF. Please try again.');
    } finally {
      if (wrapper && wrapper.parentNode) {
        wrapper.parentNode.removeChild(wrapper);
      }
      this.isDownloadingPdf.set(false);
    }
  }

  //Show debug information in browser console
  debugInfo(): void {
    console.group('🔍 RECEIPT MANAGEMENT DEBUG INFO');
    console.log('API URL:', 'http://localhost:8080/api/receipts');
    console.log('Current Error:', this.error());
    console.log('Receipts Count:', this.receipts().length);
    console.log('Is Loading:', this.isLoading());
    console.log('Filtered Results Count:', this.filteredReceipts().length);
    console.log('---');
    console.log('📋 Check these:');
    console.log('1. Is backend running? (http://localhost:8080)');
    console.log('2. Are there paid orders in the database?');
    console.log('3. Check Network tab (F12) for API response');
    console.log('4. Check backend logs for errors');
    console.groupEnd();
    alert('✅ Debug info logged to browser console (F12)');
  }

  // Generate receipt HTML for printing (optimized for 1 page)
  private generateReceiptHTML(receipt: ReceiptDTO): string {
    const financials = calculateFinancialBreakdown(receipt);
    const css = this.getReceiptCssForPrintDocument();
    const markup = this.getReceiptMarkup(receipt, financials);

    return `<!DOCTYPE html><html><head><meta charset="UTF-8"><title>Receipt-${receipt.orderNumber}</title><style>${css}</style></head><body>${markup}</body></html>`;
  }

  private getReceiptCssForPrintDocument(): string {
    return `*{margin:0;padding:0;box-sizing:border-box;}body{font-family:Arial,sans-serif;font-size:11px;color:#333;line-height:1.25;background:#fff;}@page{size:A4;margin:10mm;}@media print{body{margin:0;padding:0;}.no-print{display:none !important;}}.receipt-container{width:100%;max-width:190mm;margin:0 auto;page-break-inside:avoid;display:flex;flex-direction:column;}.receipt-header{text-align:center;border-bottom:1px solid #000;padding:6px 0;margin-bottom:6px;}.receipt-header h1{font-size:16px;margin:0;font-weight:bold;letter-spacing:0.5px;}.receipt-header p{font-size:9px;margin:2px 0;}.receipt-section{margin-bottom:6px;page-break-inside:avoid;}.receipt-section-title{font-weight:bold;font-size:10px;border-bottom:1px solid #ddd;padding:3px 0;margin-bottom:4px;}.receipt-row{display:flex;justify-content:space-between;font-size:10px;padding:2px 0;margin:0;}.receipt-row.total{font-weight:bold;font-size:11px;border-top:1px solid #000;border-bottom:1px solid #000;padding:3px 0;margin:4px 0;}.receipt-row span:first-child{flex:1;}.receipt-row span:last-child{text-align:right;flex-shrink:0;}.info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:9px;}.info-item{page-break-inside:avoid;}.info-label{font-weight:bold;}.info-value{margin:0;}.items-table{width:100%;border-collapse:collapse;font-size:10px;margin:4px 0;}.items-table th{background:#f5f5f5;padding:3px 4px;text-align:left;font-size:9px;font-weight:bold;border-bottom:1px solid #000;}.items-table td{padding:3px 4px;border-bottom:0.5px solid #eee;}.receipt-footer{text-align:center;font-size:8px;color:#666;margin-top:8px;padding-top:6px;border-top:1px solid #ddd;display:flex;flex-direction:column;justify-content:flex-end;}`;
  }

  // CSS used for the hidden DOM that html2canvas snapshots.
  // MUST be scoped so it doesn't affect the visible app UI.
  private getReceiptCssForInlineRender(): string {
    const scope = '[data-receipt-render]';
    return `${scope},${scope} *{box-sizing:border-box;}${scope}{font-family:Arial,sans-serif;font-size:11px;color:#333;line-height:1.25;background:#fff;}${scope} .receipt-container{width:100%;max-width:190mm;margin:0 auto;display:flex;flex-direction:column;}${scope} .receipt-header{text-align:center;border-bottom:1px solid #000;padding:6px 0;margin-bottom:6px;}${scope} .receipt-header h1{font-size:16px;margin:0;font-weight:bold;letter-spacing:0.5px;}${scope} .receipt-header p{font-size:9px;margin:2px 0;}${scope} .receipt-section{margin-bottom:6px;}${scope} .receipt-section-title{font-weight:bold;font-size:10px;border-bottom:1px solid #ddd;padding:3px 0;margin-bottom:4px;}${scope} .receipt-row{display:flex;justify-content:space-between;font-size:10px;padding:2px 0;margin:0;}${scope} .receipt-row.total{font-weight:bold;font-size:11px;border-top:1px solid #000;border-bottom:1px solid #000;padding:3px 0;margin:4px 0;}${scope} .receipt-row span:first-child{flex:1;}${scope} .receipt-row span:last-child{text-align:right;flex-shrink:0;}${scope} .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:6px;font-size:9px;}${scope} .info-label{font-weight:bold;}${scope} .info-value{margin:0;}${scope} .items-table{width:100%;border-collapse:collapse;font-size:10px;margin:4px 0;}${scope} .items-table th{background:#f5f5f5;padding:3px 4px;text-align:left;font-size:9px;font-weight:bold;border-bottom:1px solid #000;}${scope} .items-table td{padding:3px 4px;border-bottom:0.5px solid #eee;}${scope} .receipt-footer{text-align:center;font-size:8px;color:#666;margin-top:8px;padding-top:6px;border-top:1px solid #ddd;display:flex;flex-direction:column;justify-content:flex-end;}`;
  }

  private getReceiptMarkup(receipt: ReceiptDTO, financials: FinancialBreakdown): string {
    const itemsHTML = receipt.items
      .map(
        (item) =>
          `<tr><td style="padding: 3px 4px; font-size: 10px; text-align: left;">${item.itemName}</td><td style="padding: 3px 4px; font-size: 9px; text-align: left;">${item.portionName}</td><td style="padding: 3px 4px; font-size: 10px; text-align: center;">${item.quantity}</td><td style="padding: 3px 4px; font-size: 10px; text-align: right;">Rs.${item.price.toFixed(2)}</td><td style="padding: 3px 4px; font-size: 10px; text-align: right;">Rs.${item.lineTotal.toFixed(2)}</td></tr>`
      )
      .join('');

    return `<div class="receipt-container"><div class="receipt-header"><h1>RECEIPT</h1><p>Order #: ${receipt.orderNumber} | ${new Date(receipt.createdAt).toLocaleDateString('en-IN')}</p></div><div class="receipt-section"><div class="info-grid"><div class="info-item"><div class="info-label">Type:</div><div class="info-value">${receipt.orderType}</div></div>${receipt.tableId ? `<div class="info-item"><div class="info-label">Table:</div><div class="info-value">${receipt.tableId}</div></div>` : '<div></div>'}</div></div><div class="receipt-section"><div class="receipt-section-title">ITEMS</div><table class="items-table"><thead><tr><th>Item</th><th>Portion</th><th>Qty</th><th>Price</th><th>Total</th></tr></thead><tbody>${itemsHTML}</tbody></table></div><div class="receipt-section"><div class="receipt-row"><span>Subtotal:</span><span>Rs.${financials.subTotal.toFixed(2)}</span></div>${financials.discount > 0 ? `<div class="receipt-row"><span>Discount:</span><span>-Rs.${financials.discount.toFixed(2)}</span></div>` : ''}<div class="receipt-row"><span>Tax:</span><span>Rs.${financials.tax.toFixed(2)}</span></div>${financials.serviceCharge > 0 ? `<div class="receipt-row"><span>Service Charge:</span><span>Rs.${financials.serviceCharge.toFixed(2)}</span></div>` : ''}<div class="receipt-row total"><span>TOTAL</span><span>Rs.${financials.total.toFixed(2)}</span></div></div><div class="receipt-section"><div class="receipt-row"><span>Method:</span><span>${receipt.paymentMethod.toUpperCase()}</span></div><div class="receipt-row"><span>Paid:</span><span>Rs.${receipt.paymentAmount.toFixed(2)}</span></div>${receipt.tipAmount > 0 ? `<div class="receipt-row"><span>Tip:</span><span>Rs.${receipt.tipAmount.toFixed(2)}</span></div>` : ''}${financials.change > 0 ? `<div class="receipt-row"><span>Change:</span><span>Rs.${financials.change.toFixed(2)}</span></div>` : ''}</div><div class="receipt-footer"><p>Thank you!</p><p style="font-size:8px;color:#999;">Generated: ${new Date().toLocaleTimeString('en-IN')}</p></div></div>`;
  }

  // Navigate to next page
  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  //Navigate to previous page
  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  // Go to specific page
  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  //Get display date for receipt
  getDisplayDate(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Get page numbers for pagination
  getPageNumbers(): number[] {
    const total = this.totalPages();
    const pages: number[] = [];
    for (let i = 1; i <= total; i++) {
      pages.push(i);
    }
    return pages;
  }

  //Get relative time display (ex:"2 hours ago")
  getRelativeTime(date: string | Date): string {
    const d = typeof date === 'string' ? new Date(date) : date;
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString('en-IN');
  }

  //Send receipt to customer email
  sendToMail(): void {
    const receipt = this.selectedReceipt();
    if (!receipt || !receipt.customerEmail || !receipt.customerId) {
      alert('Customer email is not available');
      return;
    }

    const financials = calculateFinancialBreakdown(receipt);
    const emailBody = this.generateEmailBody(receipt, financials);

    this.receiptService.sendReceiptToEmail(receipt.orderId, receipt.customerEmail, emailBody).subscribe({
      next: () => {
        alert(`Receipt sent successfully to ${receipt.customerEmail}`);
      },
      error: (err) => {
        console.error('Error sending email:', err);
        alert(`Failed to send email: ${err.error?.message || 'Please try again'}`);
      },
    });
  }

  //Generate email body for receipt
  private generateEmailBody(receipt: ReceiptDTO, financials: FinancialBreakdown): string {
    const itemsList = receipt.items
      .map((item) => `${item.itemName} (${item.portionName}) × ${item.quantity} = Rs. ${item.lineTotal.toFixed(2)}`)
      .join('<br/>');

    return `
      <html>
      <body style="font-family: Arial, sans-serif; color: #333;">
        <h2>Receipt - ${receipt.orderNumber}</h2>
        <p><strong>Date:</strong> ${new Date(receipt.createdAt).toLocaleString('en-IN')}</p>

        <h3>Order Information</h3>
        <p>
          <strong>Order Type:</strong> ${receipt.orderType}<br/>
          ${receipt.tableId ? `<strong>Table:</strong> ${receipt.tableId}<br/>` : ''}
          <strong>Status:</strong> Paid
        </p>

        <h3>Order Items</h3>
        <p>${itemsList}</p>

        <h3>Financial Summary</h3>
        <p>
          <strong>Subtotal:</strong> Rs. ${financials.subTotal.toFixed(2)}<br/>
          ${financials.discount > 0 ? `<strong>Discount:</strong> -Rs. ${financials.discount.toFixed(2)}<br/>` : ''}
          <strong>Tax:</strong> Rs. ${financials.tax.toFixed(2)}<br/>
          ${financials.serviceCharge > 0 ? `<strong>Service Charge:</strong> Rs. ${financials.serviceCharge.toFixed(2)}<br/>` : ''}
          <strong style="font-size: 16px;">TOTAL: Rs. ${financials.total.toFixed(2)}</strong>
        </p>

        <h3>Payment Details</h3>
        <p>
          <strong>Payment Method:</strong> ${receipt.paymentMethod.toUpperCase()}<br/>
          <strong>Amount Paid:</strong> Rs. ${receipt.paymentAmount.toFixed(2)}<br/>
          ${receipt.tipAmount > 0 ? `<strong>Tip:</strong> Rs. ${receipt.tipAmount.toFixed(2)}<br/>` : ''}
          ${financials.change > 0 ? `<strong>Change:</strong> Rs. ${financials.change.toFixed(2)}<br/>` : ''}
        </p>

        <hr/>
        <p style="text-align: center; color: #666; font-size: 12px;">
          Thank you for your purchase!<br/>
          This receipt was generated on ${new Date().toLocaleString('en-IN')}
        </p>
      </body>
      </html>
    `;
  }
}

