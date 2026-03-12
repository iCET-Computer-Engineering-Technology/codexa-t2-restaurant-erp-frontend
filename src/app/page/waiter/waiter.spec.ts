import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Waiter } from './waiter';

describe('Waiter', () => {
  let component: Waiter;
  let fixture: ComponentFixture<Waiter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Waiter]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Waiter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
