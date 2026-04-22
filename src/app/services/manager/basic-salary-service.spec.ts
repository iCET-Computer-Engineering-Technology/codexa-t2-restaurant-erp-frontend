import { TestBed } from '@angular/core/testing';

import { BasicSalaryService } from './basic-salary-service';

describe('BasicSalaryService', () => {
  let service: BasicSalaryService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BasicSalaryService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
