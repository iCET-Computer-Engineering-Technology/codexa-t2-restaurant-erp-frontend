import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MenuItemPrice } from './menu-item-price';

describe('MenuItemPrice', () => {
  let component: MenuItemPrice;
  let fixture: ComponentFixture<MenuItemPrice>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MenuItemPrice]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MenuItemPrice);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
