import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PayrollConfig } from './payroll-config';

describe('PayrollConfig', () => {
  let component: PayrollConfig;
  let fixture: ComponentFixture<PayrollConfig>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PayrollConfig]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PayrollConfig);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
