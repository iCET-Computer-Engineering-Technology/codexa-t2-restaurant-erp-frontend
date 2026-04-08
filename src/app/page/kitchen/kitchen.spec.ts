import { ComponentFixture, TestBed } from '@angular/core/testing';
import { of } from 'rxjs';

import { Kitchen } from './kitchen';
import { KitchenService } from '../../services/kitchen.service';

describe('Kitchen', () => {
  let component: Kitchen;
  let fixture: ComponentFixture<Kitchen>;
  const kitchenServiceMock = {
    getDashboardOrders: () => of([]),
    getAvailableWaiters: () => of([]),
    updateOrderStatus: () => of(undefined),
    sendToKitchen: () => of(undefined),
    assignWaiterWithFallback: () => of(undefined),
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Kitchen],
      providers: [{ provide: KitchenService, useValue: kitchenServiceMock }],
    })
    .compileComponents();

    fixture = TestBed.createComponent(Kitchen);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
