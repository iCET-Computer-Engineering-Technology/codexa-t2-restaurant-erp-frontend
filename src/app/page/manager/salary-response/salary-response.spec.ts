import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalaryResponse } from './salary-response';

describe('SalaryResponse', () => {
  let component: SalaryResponse;
  let fixture: ComponentFixture<SalaryResponse>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalaryResponse]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalaryResponse);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
