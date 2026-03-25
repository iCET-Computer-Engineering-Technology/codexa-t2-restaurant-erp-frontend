import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OrderAssign } from './order-assign';

describe('OrderAssign', () => {
  let component: OrderAssign;
  let fixture: ComponentFixture<OrderAssign>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [OrderAssign]
    })
    .compileComponents();

    fixture = TestBed.createComponent(OrderAssign);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
