import { ChangeDetectionStrategy, ChangeDetectorRef, Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil, timeout } from 'rxjs/operators';
import Swal from 'sweetalert2';
import { OrderService } from '../../services/order.service';
import {
    CustomerDto,
    MenuCategoriesDto,
    MenuItemPriceDto,
    MenuItemsDto,
    OrderCartItem,
    OrderCreateRequest,
    PortionDto,
    TableDto,
} from '../../models/order-placement.model';

@Component({
    selector: 'app-order-placement',
    imports: [CommonModule, FormsModule],
    templateUrl: './order-placement.component.html',
    styleUrl: './order-placement.component.css',
    changeDetection: ChangeDetectionStrategy.OnPush,
})
export class OrderPlacementComponent implements OnInit, OnDestroy {
    // Data arrays
    categories: MenuCategoriesDto[] = [];
    menuItems: MenuItemsDto[] = [];
    tables: TableDto[] = [];
    cartItems: OrderCartItem[] = [];

    // Loading states
    loadingCategories = false;
    loadingMenuItems = false;
    loadingTables = false;
    loadingPortions = false;
    loadingPrices: { [key: number]: boolean } = {};
    loadingCustomer = false;
    submittingOrder = false;

    // Selected values
    selectedCategoryId: number | null = null;
    selectedOrderType = 'dine_in';
    selectedTableId: number | null = null;
    selectedCustomer: CustomerDto | null = null;
    orderNotes = '';
    customerSearchMobile = '';

    // Messages
    errorMessage = '';
    successMessage = '';

    // Prices cache for menu items
    menuItemPrices: { [key: number]: MenuItemPriceDto[] } = {};

    // Portion name lookup (optional master list)
    private portionsById: Record<number, string> = {};

    // Component lifecycle
    private destroy$ = new Subject<void>();
    private cancelMenuLoads$ = new Subject<void>();

    constructor(
        private readonly orderService: OrderService,
        private readonly cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        console.log('OrderPlacementComponent initialized');
        this.loadPortions();
        this.loadCategories();
        this.loadTables();
    }

    private loadPortions(): void {
        this.loadingPortions = true;
        this.orderService
            .getAllPortions()
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (portions: PortionDto[]) => {
                    this.portionsById = Object.fromEntries(
                        (portions ?? [])
                            .filter((p) => p.isActive)
                            .map((p) => [p.id, p.name])
                    );
                    this.loadingPortions = false;
                    this.requestRender();
                },
                error: () => {
                    this.loadingPortions = false;
                    this.requestRender();
                },
            });
    }

    getDisplayPortionName(price: MenuItemPriceDto): string {
        const raw = (price?.portionName ?? '').trim();
        // If backend returned a real name, prefer it
        if (raw.length > 0 && raw !== 'Default' && !/^Portion\s+\d+$/i.test(raw)) {
            return raw;
        }
        const mapped = this.portionsById[price.portionId];
        if (mapped && mapped.trim().length > 0) {
            return mapped.trim();
        }
        // Stable fallback so it's not always "Default"
        if (Number.isFinite(price.portionId) && price.portionId > 0) {
            return `Portion ${price.portionId}`;
        }
        return 'Portion';
    }

    ngOnDestroy(): void {
        this.destroy$.next();
        this.destroy$.complete();

        this.cancelMenuLoads$.next();
        this.cancelMenuLoads$.complete();
    }

    //CATEGORY & MENU LOADING
    loadCategories(): void {
        console.log('loadCategories() called');
        this.loadingCategories = true;
        this.errorMessage = '';

        this.orderService
            .getAllCategories()
            .pipe(
                timeout(4000), //timeout after 4 seconds
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (data) => {
                    console.log('✓ Categories loaded from API:', data);
                    this.categories = data?.filter((c) => c.isActive) || [];
                    this.loadingCategories = false;
                    this.requestRender();

                    //Auto select first category
                    if (this.categories.length > 0) {
                        this.selectCategory(this.categories[0].id);
                    } else {
                        this.errorMessage = 'No categories available.';
                        this.requestRender();
                    }
                },
                error: (err) => {
                    console.error('✗ Error loading categories from API:', err);
                    this.loadingCategories = false;
                    this.errorMessage = 'Failed to load categories. Please refresh the page.';
                    this.requestRender();
                },
            });
    }





    selectCategory(categoryId: number): void {
        // Cancel any in flight menu/price requests from previous category
        this.cancelMenuLoads$.next();

        this.selectedCategoryId = categoryId;
        this.loadMenuItems(categoryId);
        this.requestRender();
    }

    loadMenuItems(categoryId: number): void {
        console.log('loadMenuItems() called for category:', categoryId);
        this.loadingMenuItems = true;
        this.errorMessage = '';

        // Clear previous category items immediately to avoid showing stale cards
        this.menuItems = [];

        // Reset prices cache so portions always refresh with the menu list
        this.menuItemPrices = {};
        this.loadingPrices = {};

        this.orderService
            .getMenuItemsByCategory(categoryId)
            .pipe(
                timeout(4000), // Timeout after 4 seconds
                takeUntil(this.destroy$),
                takeUntil(this.cancelMenuLoads$)
            )
            .subscribe({
                next: (data) => {
                    console.log('✓ Menu items loaded from API:', data);
                    this.menuItems = data ? data.filter((item) => item.isAvailable !== false) : [];
                    this.loadingMenuItems = false;
                    this.requestRender();

                    // Load prices for all items
                    this.menuItems.forEach((item) => {
                        this.loadItemPrices(item.id);
                    });
                },
                error: (err) => {
                    console.error('✗ Error loading menu items from API:', err);
                    this.loadingMenuItems = false;
                    this.errorMessage = 'Failed to load menu items. Please select another category.';
                    this.requestRender();
                },
            });
    }

    loadItemPrices(itemId: number): void {
        // Skip if already loaded (even if empty) or currently in flight
        if (Object.prototype.hasOwnProperty.call(this.menuItemPrices, itemId) || this.loadingPrices[itemId]) {
            return;
        }

        this.loadingPrices[itemId] = true;
        this.requestRender();

        this.orderService
            .getItemPrices(itemId)
            .pipe(
                timeout(10000), // Prices can take longer; avoid false timeouts
                takeUntil(this.destroy$),
                takeUntil(this.cancelMenuLoads$)
            )
            .subscribe({
                next: (prices) => {
                    console.log('✓ Prices loaded for item', itemId, ':', prices);
                    this.menuItemPrices[itemId] = prices ? prices.filter((p) => p.isActive) : [];
                    this.loadingPrices[itemId] = false;
                    this.requestRender();
                },
                error: (err) => {
                    console.error('✗ Error loading prices for item:', itemId, err);
                    this.menuItemPrices[itemId] = [];
                    this.loadingPrices[itemId] = false;
                    this.requestRender();
                },
            });
    }

    //TABLE LOADING
    loadTables(): void {
        console.log('loadTables() called');
        this.loadingTables = true;
        this.errorMessage = '';

        this.orderService
            .getAllTables()
            .pipe(
                timeout(4000), // Timeout after 4 seconds
                takeUntil(this.destroy$)
            )
            .subscribe({
                next: (data) => {
                    console.log('✓ Tables loaded from API:', data);
                    this.tables = data ? data.filter((t) => t.status !== 'OCCUPIED') : [];
                    this.loadingTables = false;
                    this.requestRender();
                },
                error: (err) => {
                    console.error('✗ Error loading tables from API:', err);
                    this.loadingTables = false;
                    this.errorMessage = 'Failed to load tables. Please refresh the page.';
                    this.requestRender();
                },
            });
    }

    //CART MANAGEMENT 
    addToCart(item: MenuItemsDto, portion: MenuItemPriceDto): void {
        const existingItem = this.cartItems.find(
            (cart) => cart.menuItemId === item.id && cart.portionId === portion.portionId
        );

        if (existingItem) {
            existingItem.quantity = existingItem.quantity + 1;
        } else {
            const cartItem: OrderCartItem = {
                menuItemId: item.id,
                menuItemName: item.name,
                portionId: portion.portionId,
                portionName: this.getDisplayPortionName(portion),
                price: portion.price,
                quantity: 1,
            };
            this.cartItems.push(cartItem);
        }

        this.showSuccessMessage(`${item.name} added to cart!`);
        this.requestRender();
    }

    removeFromCart(itemId: number, portionId: number): void {
        this.cartItems = this.cartItems.filter(
            (item) => !(item.menuItemId === itemId && item.portionId === portionId)
        );
        this.requestRender();
    }

    updateQuantity(itemId: number, portionId: number, quantity: number): void {
        const item = this.cartItems.find(
            (cart) => cart.menuItemId === itemId && cart.portionId === portionId
        );
        if (item) {
            item.quantity = Math.max(1, Number(quantity) || 1);
            this.requestRender();
        }
    }

    updateNotes(itemId: number, portionId: number, notes: string): void {
        const item = this.cartItems.find(
            (cart) => cart.menuItemId === itemId && cart.portionId === portionId
        );
        if (item) {
            item.notes = notes;
            this.requestRender();
        }
    }

    getCartTotal(): number {
        return this.cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
    }

    getCartItemCount(): number {
        return this.cartItems.reduce((count, item) => count + item.quantity, 0);
    }

    // CUSTOMER SEARCH 
    searchCustomer(): void {
        if (!this.customerSearchMobile.trim()) {
            this.errorMessage = 'Please enter a mobile number';
            this.requestRender();
            return;
        }

        this.loadingCustomer = true;
        this.errorMessage = '';
        this.requestRender();

        this.orderService
            .searchCustomer(this.customerSearchMobile)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (customer) => {
                    this.selectedCustomer = customer;
                    this.loadingCustomer = false;
                    this.showSuccessMessage(
                        `Customer found: ${customer.firstName || ''} ${customer.lastName || ''}`
                    );
                    this.requestRender();
                },
                error: (err) => {
                    console.error('Error searching customer:', err);
                    this.selectedCustomer = null;
                    this.loadingCustomer = false;
                    this.errorMessage = 'Customer not found. Proceeding as walk-in order.';
                    this.requestRender();
                },
            });
    }

    clearCustomer(): void {
        this.selectedCustomer = null;
        this.customerSearchMobile = '';
        this.requestRender();
    }

    onOrderTypeChange(): void {
        if (this.selectedOrderType !== 'dine_in') {
            this.selectedTableId = null;
        }
        this.requestRender();
    }

    //ORDER SUBMISSION
    submitOrder(): void {
        // Validation
        if (this.cartItems.length === 0) {
            this.errorMessage = 'Please add at least one item to the order.';
            this.requestRender();
            return;
        }

        if (this.selectedOrderType === 'dine_in' && !this.selectedTableId) {
            this.errorMessage = 'Please select a table for dine-in orders.';
            this.requestRender();
            return;
        }

        const placedItems: OrderCartItem[] = this.cartItems.map((i) => ({ ...i }));
        const placedTotal = this.getCartTotal();

        this.submittingOrder = true;
        this.errorMessage = '';
        this.requestRender();

        // Build order request
        const orderRequest: OrderCreateRequest = {
            orderType: this.selectedOrderType,
            tableId:
                this.selectedOrderType === 'dine_in'
                    ? this.selectedTableId || undefined
                    : undefined,
            customerId: this.selectedCustomer?.id,
            notes: this.orderNotes,
            items: this.cartItems.map((item) => ({
                menuItemId: item.menuItemId,
                portionId: item.portionId,
                quantity: item.quantity,
                price: item.price,
                notes: item.notes,
            })),
        };

        this.orderService
            .createOrder(orderRequest)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
                next: (response) => {
                    this.submittingOrder = false;
                    this.showOrderSuccessPopup(response?.orderNumber, placedItems, placedTotal);
                    this.resetOrder();
                    this.requestRender();
                },
                error: (err) => {
                    console.error('Error creating order:', err);
                    this.submittingOrder = false;
                    this.errorMessage = 'Order failed. Please try again.';
                    this.requestRender();
                },
            });
    }

    private showOrderSuccessPopup(
        orderNumber: string | number | undefined,
        items: OrderCartItem[],
        total: number
    ): void {
        const title = orderNumber ? `Order #${orderNumber}` : 'Order Created';

        const rowsHtml = (items ?? [])
            .map((i) => {
                const itemName = this.escapeHtml(i.menuItemName ?? '');
                const portionName = this.escapeHtml(i.portionName ?? '');
                const qty = Number(i.quantity) || 0;
                const unit = Number(i.price) || 0;
                const line = unit * qty;
                return `
                                    <tr class="border-b border-gray-100">
                                        <td class="py-2 pr-2">
                                            <div class="font-semibold text-gray-900">${itemName}</div>
                                            <div class="text-xs text-gray-500">${portionName}</div>
                                        </td>
                                        <td class="py-2 px-2 text-right font-mono text-xs text-gray-700 whitespace-nowrap">Rs. ${unit.toFixed(2)}</td>
                                        <td class="py-2 px-2 text-right font-mono text-xs text-gray-700 whitespace-nowrap">${qty}</td>
                                        <td class="py-2 pl-2 text-right font-mono text-xs text-gray-700 whitespace-nowrap">Rs. ${line.toFixed(2)}</td>
                                    </tr>`;
            })
            .join('');

        const html = `
                    <div class="text-left">
                        <div class="text-sm text-gray-700">Order placed successfully.</div>
                        <div class="mt-4 overflow-x-auto">
                            <table class="min-w-full text-sm">
                                <thead>
                                    <tr class="bg-gray-100 border-b border-gray-200">
                                        <th class="py-2 pr-2 text-left text-xs font-semibold text-gray-700">Item</th>
                                        <th class="py-2 px-2 text-right text-xs font-semibold text-gray-700">Unit</th>
                                        <th class="py-2 px-2 text-right text-xs font-semibold text-gray-700">Qty</th>
                                        <th class="py-2 pl-2 text-right text-xs font-semibold text-gray-700">Total</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    ${rowsHtml || '<tr><td colspan="4" class="py-6 text-center text-sm text-gray-500">No items</td></tr>'}
                                </tbody>
                            </table>
                        </div>
                        <div class="mt-4 flex items-baseline justify-between border-t border-gray-200 pt-3">
                            <span class="text-sm font-semibold text-gray-900">Grand Total</span>
                            <span class="text-sm font-bold text-blue-600">Rs. ${(Number(total) || 0).toFixed(2)}</span>
                        </div>
                    </div>`;

        Swal.fire({
            icon: 'success',
            title,
            html,
            confirmButtonText: 'OK',
            confirmButtonColor: '#3b82f6',
            width: 720,
        });
    }

    private escapeHtml(value: string): string {
        return String(value)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#039;');
    }

    resetOrder(): void {
        this.cartItems = [];
        this.selectedOrderType = 'dine_in';
        this.selectedTableId = null;
        this.selectedCustomer = null;
        this.customerSearchMobile = '';
        this.orderNotes = '';
        this.requestRender();

        setTimeout(() => {
            this.successMessage = '';
            this.requestRender();
        }, 5000);
    }

    //UI HELPER METHODS
    getItemPrices(itemId: number): MenuItemPriceDto[] {
        return this.menuItemPrices[itemId] || [];
    }

    isLoadingPrices(itemId: number): boolean {
        return this.loadingPrices[itemId] || false;
    }

    private showSuccessMessage(message: string): void {
        this.successMessage = message;
        this.requestRender();
        setTimeout(() => {
            this.successMessage = '';
            this.requestRender();
        }, 3000);
    }

    private requestRender(): void {
        Promise.resolve().then(() => {
            try {
                this.cdr.detectChanges();
            } catch {
                // Ignore detectChanges errors during teardown.
            }
        });
    }
}
