import { TestBed } from '@angular/core/testing';

import { DeductionService } from './deduction-service';

describe('DeductionService', () => {
  let service: DeductionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(DeductionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
