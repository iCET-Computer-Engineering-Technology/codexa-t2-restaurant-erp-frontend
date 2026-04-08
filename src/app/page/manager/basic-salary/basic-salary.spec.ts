import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BasicSalary } from './basic-salary';

describe('BasicSalary', () => {
  let component: BasicSalary;
  let fixture: ComponentFixture<BasicSalary>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BasicSalary]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BasicSalary);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
