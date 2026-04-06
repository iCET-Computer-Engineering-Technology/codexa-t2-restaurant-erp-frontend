import { TestBed } from '@angular/core/testing';

import { OvertimeService } from './overtime-service';

describe('OvertimeService', () => {
  let service: OvertimeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(OvertimeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
