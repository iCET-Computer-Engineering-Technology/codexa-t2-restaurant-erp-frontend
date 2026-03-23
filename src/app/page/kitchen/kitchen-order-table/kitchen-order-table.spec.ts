import { ComponentFixture, TestBed } from '@angular/core/testing';

import { KitchenOrderTable } from './kitchen-order-table';

describe('KitchenOrderTable', () => {
  let component: KitchenOrderTable;
  let fixture: ComponentFixture<KitchenOrderTable>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KitchenOrderTable]
    })
    .compileComponents();

    fixture = TestBed.createComponent(KitchenOrderTable);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
