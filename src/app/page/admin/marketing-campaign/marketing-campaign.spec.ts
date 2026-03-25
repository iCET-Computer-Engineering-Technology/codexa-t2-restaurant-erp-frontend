import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MarketingCampaign } from './marketing-campaign';

describe('MarketingCampaign', () => {
  let component: MarketingCampaign;
  let fixture: ComponentFixture<MarketingCampaign>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MarketingCampaign]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MarketingCampaign);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
