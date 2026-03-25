import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutomatedMessagesComponent } from './automated-messages';

describe('AutomatedMessagesComponent', () => {
  let component: AutomatedMessagesComponent;
  let fixture: ComponentFixture<AutomatedMessagesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutomatedMessagesComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutomatedMessagesComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
