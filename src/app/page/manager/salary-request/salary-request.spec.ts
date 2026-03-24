import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SalaryRequest } from './salary-request';

describe('SalaryRequest', () => {
  let component: SalaryRequest;
  let fixture: ComponentFixture<SalaryRequest>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SalaryRequest]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SalaryRequest);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
