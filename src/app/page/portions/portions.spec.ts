import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Portions } from './portions';

describe('Portions', () => {
  let component: Portions;
  let fixture: ComponentFixture<Portions>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Portions]
    })
    .compileComponents();

    fixture = TestBed.createComponent(Portions);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
