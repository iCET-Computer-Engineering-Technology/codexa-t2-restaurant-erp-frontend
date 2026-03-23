import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AutomatedMessages } from './automated-messages';

describe('AutomatedMessages', () => {
  let component: AutomatedMessages;
  let fixture: ComponentFixture<AutomatedMessages>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AutomatedMessages]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AutomatedMessages);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
