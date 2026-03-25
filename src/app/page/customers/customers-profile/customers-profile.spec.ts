import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CustomersProfile } from './customers-profile';

describe('CustomersProfile', () => {
  let component: CustomersProfile;
  let fixture: ComponentFixture<CustomersProfile>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CustomersProfile]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CustomersProfile);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
