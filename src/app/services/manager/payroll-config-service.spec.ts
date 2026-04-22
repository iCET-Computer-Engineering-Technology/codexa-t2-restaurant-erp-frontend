import { TestBed } from '@angular/core/testing';

import { PayrollConfigService } from './payroll-config-service';

describe('PayrollConfigService', () => {
  let service: PayrollConfigService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PayrollConfigService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
