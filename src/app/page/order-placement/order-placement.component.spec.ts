import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { describe, it, expect, beforeEach, vi } from 'vitest';

import { OrderPlacementComponent } from './order-placement.component';
import { OrderService } from '../../services/order.service';
import { MenuCategoriesDto, MenuItemsDto, MenuItemPriceDto, OrderTypeDto, TableDto } from '../../models/order-placement.model';

describe('OrderPlacementComponent', () => {
    let component: OrderPlacementComponent;
    let fixture: ComponentFixture<OrderPlacementComponent>;
    let orderService: OrderService;

    const mockOrderTypes: OrderTypeDto[] = [
        { id: 1, typeName: 'dine_in', isActive: true },
        { id: 2, typeName: 'takeaway', isActive: true },
    ];

    const mockCategories: MenuCategoriesDto[] = [
        { id: 1, name: 'Appetizers', isActive: true },
        { id: 2, name: 'Mains', isActive: true },
    ];

    const mockTables: TableDto[] = [
        { id: 1, tableNumber: '1', capacity: 4, status: 'AVAILABLE' },
        { id: 2, tableNumber: '2', capacity: 6, status: 'AVAILABLE' },
    ];

    const mockMenuItems: MenuItemsDto[] = [
        { id: 1, categoryId: 1, categoryName: 'Appetizers', name: 'Spring Rolls', description: 'Fresh spring rolls', isAvailable: true },
        { id: 2, categoryId: 1, categoryName: 'Appetizers', name: 'Garlic Bread', description: 'Crispy garlic bread', isAvailable: true },
    ];

    const mockMenuItemPrices: MenuItemPriceDto[] = [
        { id: 1, itemId: 1, portionId: 1, price: 150, portionName: 'Half Plate', isActive: true },
        { id: 2, itemId: 1, portionId: 2, price: 250, portionName: 'Full Plate', isActive: true },
    ];

    beforeEach(async () => {
        const mockOrderService = {
            getActiveOrderTypes: vi.fn().mockReturnValue(of(mockOrderTypes)),
            getAllCategories: vi.fn().mockReturnValue(of(mockCategories)),
            getAllTables: vi.fn().mockReturnValue(of(mockTables)),
            getMenuItemsByCategory: vi.fn().mockReturnValue(of(mockMenuItems)),
            getItemPrices: vi.fn().mockReturnValue(of(mockMenuItemPrices)),
            searchCustomer: vi.fn().mockReturnValue(throwError(() => new Error('Not found'))),
            createOrder: vi.fn().mockReturnValue(of({ id: 1, orderNumber: 'ORD001', orderType: 'dine_in', status: 'pending' })),
        };

        await TestBed.configureTestingModule({
            imports: [OrderPlacementComponent],
            providers: [
                { provide: OrderService, useValue: mockOrderService },
            ],
        }).compileComponents();

        orderService = TestBed.inject(OrderService);
        fixture = TestBed.createComponent(OrderPlacementComponent);
        component = fixture.componentInstance;
    });

    describe('Initialization & API Call Optimization', () => {
        it('should create', () => {
            expect(component).toBeTruthy();
        });

        it('should load order types on init', async () => {
            fixture.detectChanges();
            await fixture.whenStable();

            expect(orderService.getActiveOrderTypes).toHaveBeenCalledTimes(1);
            expect(component.orderTypes.length).toBeGreaterThan(0);
        });

        it('should load categories on init', async () => {
            fixture.detectChanges();
            await fixture.whenStable();

            expect(orderService.getAllCategories).toHaveBeenCalledTimes(1);
            expect(component.categories.length).toBeGreaterThan(0);
        });

        it('should NOT load tables on init (only needed for dine_in)', async () => {
            fixture.detectChanges();
            await fixture.whenStable();

            // Tables should load lazily only when dine_in is selected
            expect(orderService.getAllTables).not.toHaveBeenCalled();
        });

        it('should load tables only when dine_in order type is selected', async () => {
            fixture.detectChanges();
            await fixture.whenStable();

            // Reset spy call count
            vi.clearAllMocks();

            // Reapply mocks
            vi.mocked(orderService.getAllTables).mockReturnValue(of(mockTables));

            // Simulate selecting dine_in order type
            component.selectedOrderTypeId = 1;
            component.onOrderTypeChange();
            await fixture.whenStable();

            expect(orderService.getAllTables).toHaveBeenCalled();
        });

        it('should NOT load tables when takeaway order type is selected', async () => {
            fixture.detectChanges();
            await fixture.whenStable();

            vi.clearAllMocks();
            vi.mocked(orderService.getAllTables).mockReturnValue(of(mockTables));

            // Select takeaway (not dine_in)
            component.selectedOrderTypeId = 2;
            component.onOrderTypeChange();
            await fixture.whenStable();

            expect(orderService.getAllTables).not.toHaveBeenCalled();
        });
    });

    describe('Category & Menu Loading', () => {
        beforeEach(async () => {
            fixture.detectChanges();
            await fixture.whenStable();
        });

        it('should auto-select first category', () => {
            expect(component.selectedCategoryId).toBe(mockCategories[0].id);
        });

        it('should load menu items when category is selected', async () => {
            fixture.detectChanges();
            await fixture.whenStable();

            expect(orderService.getMenuItemsByCategory).toHaveBeenCalledWith(mockCategories[0].id);
            expect(component.menuItems.length).toBeGreaterThan(0);
        });

        it('should load menu item prices after loading items', async () => {
            fixture.detectChanges();
            await fixture.whenStable();

            expect(orderService.getItemPrices).toHaveBeenCalledWith(mockMenuItems[0].id);
            expect(orderService.getItemPrices).toHaveBeenCalledWith(mockMenuItems[1].id);
        });

        it('should not reload prices if already cached', async () => {
            fixture.detectChanges();
            await fixture.whenStable();

            const initialCallCount = vi.mocked(orderService.getItemPrices).mock.calls.length;

            // Try to load prices again for same item
            component.loadItemPrices(mockMenuItems[0].id);
            await fixture.whenStable();

            // Should not increase call count if already cached
            expect(vi.mocked(orderService.getItemPrices).mock.calls.length).toBe(initialCallCount);
        });
    });

    describe('Cart Management', () => {
        beforeEach(async () => {
            fixture.detectChanges();
            await fixture.whenStable();
        });

        it('should add item to cart', () => {
            component.addToCart(mockMenuItems[0], mockMenuItemPrices[0]);

            expect(component.cartItems.length).toBe(1);
            expect(component.cartItems[0].menuItemName).toBe('Spring Rolls');
        });

        it('should increment quantity if item already in cart', () => {
            component.addToCart(mockMenuItems[0], mockMenuItemPrices[0]);
            component.addToCart(mockMenuItems[0], mockMenuItemPrices[0]);

            expect(component.cartItems.length).toBe(1);
            expect(component.cartItems[0].quantity).toBe(2);
        });

        it('should calculate cart total correctly', () => {
            component.addToCart(mockMenuItems[0], mockMenuItemPrices[0]); // Price: 150, Qty: 1
            component.addToCart(mockMenuItems[0], mockMenuItemPrices[1]); // Price: 250, Qty: 1

            const total = component.getCartTotal();
            expect(total).toBe(400);
        });

        it('should remove item from cart', () => {
            component.addToCart(mockMenuItems[0], mockMenuItemPrices[0]);
            component.addToCart(mockMenuItems[1], mockMenuItemPrices[1]);

            expect(component.cartItems.length).toBe(2);

            component.removeFromCart(mockMenuItems[0].id, mockMenuItemPrices[0].portionId);

            expect(component.cartItems.length).toBe(1);
            expect(component.cartItems[0].menuItemName).toBe('Garlic Bread');
        });
    });

    describe('Customer Search', () => {
        beforeEach(async () => {
            fixture.detectChanges();
            await fixture.whenStable();
        });

        it('should clear customer selection', () => {
            component.selectedCustomer = { id: 1, firstName: 'John', lastName: 'Doe', phone: '1234567890' };
            component.clearCustomer();

            expect(component.selectedCustomer).toBeNull();
            expect(component.customerSearchMobile).toBe('');
        });
    });

    describe('Order Submission', () => {
        beforeEach(async () => {
            fixture.detectChanges();
            await fixture.whenStable();
        });

        it('should validate empty cart before submission', () => {
            component.submitOrder();

            expect(component.errorMessage).toContain('add at least one item');
        });

        it('should validate table selection for dine_in orders', () => {
            component.cartItems = [
                { menuItemId: 1, menuItemName: 'Test', portionId: 1, portionName: 'Test', price: 100, quantity: 1 },
            ];
            component.selectedOrderTypeId = 1; // dine_in
            component.selectedTableId = null;

            component.submitOrder();

            expect(component.errorMessage).toContain('select a table');
        });
    });

    describe('Portion Name Display', () => {
        beforeEach(async () => {
            fixture.detectChanges();
            await fixture.whenStable();
        });

        it('should prefer backend portionName', () => {
            const price: MenuItemPriceDto = { id: 1, itemId: 1, portionId: 1, price: 100, portionName: 'Large', isActive: true };
            const displayName = component.getDisplayPortionName(price);

            expect(displayName).toBe('Large');
        });

        it('should use fallback portion naming', () => {
            const price: MenuItemPriceDto = { id: 2, itemId: 1, portionId: 5, price: 100, portionName: '', isActive: true };
            const displayName = component.getDisplayPortionName(price);

            expect(displayName).toBe('Portion 5');
        });
    });
});
