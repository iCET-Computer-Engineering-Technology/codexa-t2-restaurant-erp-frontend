import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PaymentCheckout } from './payment-checkout';

describe('PaymentCheckout', () => {
  let component: PaymentCheckout;
  let fixture: ComponentFixture<PaymentCheckout>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PaymentCheckout]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PaymentCheckout);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
