import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideHttpClientTesting, HttpTestingController } from '@angular/common/http/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideRouter } from '@angular/router';

import { KpiDashboard } from './kpi-dashboard';

describe('KpiDashboard', () => {
  let component: KpiDashboard;
  let fixture: ComponentFixture<KpiDashboard>;
  let httpMock: HttpTestingController;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [KpiDashboard],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])],
    })
    .compileComponents();

    httpMock = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(KpiDashboard);
    component = fixture.componentInstance;
    fixture.detectChanges();

    const orderRequest = httpMock.expectOne('http://localhost:8080/api/order/find-all-with-item-names');
    orderRequest.flush([]);

    const tableRequest = httpMock.expectOne('http://localhost:8080/api/tables');
    tableRequest.flush([]);

    await fixture.whenStable();
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
