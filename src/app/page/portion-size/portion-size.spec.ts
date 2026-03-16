import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PortionSize } from './portion-size';

describe('PortionSize', () => {
  let component: PortionSize;
  let fixture: ComponentFixture<PortionSize>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PortionSize]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PortionSize);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
