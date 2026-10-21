import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateOverviewComponent } from './template-overview.component';

describe('TemplateOverviewComponent', () => {
  let component: TemplateOverviewComponent;
  let fixture: ComponentFixture<TemplateOverviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateOverviewComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TemplateOverviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
