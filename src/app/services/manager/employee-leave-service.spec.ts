import { TestBed } from '@angular/core/testing';

import { EmployeeLeaveService } from './employee-leave-service';

describe('EmployeeLeaveService', () => {
  let service: EmployeeLeaveService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(EmployeeLeaveService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
