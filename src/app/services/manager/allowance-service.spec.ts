import { TestBed } from '@angular/core/testing';

import { AllowanceService } from './allowance-service';

describe('AllowanceService', () => {
  let service: AllowanceService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AllowanceService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
