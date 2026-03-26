import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SupplierIngredient } from './supplier-ingredient';

describe('SupplierIngredient', () => {
  let component: SupplierIngredient;
  let fixture: ComponentFixture<SupplierIngredient>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SupplierIngredient]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SupplierIngredient);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
