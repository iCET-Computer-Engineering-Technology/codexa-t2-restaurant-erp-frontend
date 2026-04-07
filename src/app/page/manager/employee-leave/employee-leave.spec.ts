import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EmployeeLeave } from './employee-leave';

describe('EmployeeLeave', () => {
  let component: EmployeeLeave;
  let fixture: ComponentFixture<EmployeeLeave>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EmployeeLeave]
    })
    .compileComponents();

    fixture = TestBed.createComponent(EmployeeLeave);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
