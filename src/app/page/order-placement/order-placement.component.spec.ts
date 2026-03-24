import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { OrderPlacementComponent } from './order-placement.component';
import { OrderService } from '../../services/order.service';

describe('OrderPlacementComponent', () => {
    let component: OrderPlacementComponent;
    let fixture: ComponentFixture<OrderPlacementComponent>;

    beforeEach(async () => {
        await TestBed.configureTestingModule({
            imports: [OrderPlacementComponent],
            providers: [
                {
                    provide: OrderService,
                    useValue: {
                        getActiveOrderTypes: () => of([{ id: 1, typeName: 'dine_in', isActive: true }]),
                        getAllPortions: () => of([]),
                        getAllCategories: () => of([]),
                        getAllTables: () => of([]),
                        getMenuItemsByCategory: () => of([]),
                        getItemPrices: () => of([]),
                        searchCustomer: () => of(null),
                        createOrder: () => of({ orderNumber: 1 }),
                    },
                },
            ],
        }).compileComponents();

        fixture = TestBed.createComponent(OrderPlacementComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
        await fixture.whenStable();
    });

    it('should create', () => {
        expect(component).toBeTruthy();
    });
});
