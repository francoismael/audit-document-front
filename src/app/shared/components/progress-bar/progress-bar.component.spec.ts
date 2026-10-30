import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProgressBarComponent } from './progress-bar.component';

describe('ProgressBarComponent', () => {
  let fixture: ComponentFixture<ProgressBarComponent>;
  let bar: () => HTMLProgressElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgressBarComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ProgressBarComponent);
    fixture.componentRef.setInput('value', 42.9);
    fixture.componentRef.setInput('label', 'Avancement du dossier');
    fixture.detectChanges();
    bar = () => (fixture.nativeElement as HTMLElement).querySelector('progress') as HTMLProgressElement;
  });

  it('should show the value, kept between 0 and 100, and mark a complete bar', () => {
    expect(bar().value).toBe(42.9);
    expect(bar().getAttribute('aria-label')).toBe('Avancement du dossier');
    expect(bar().classList).not.toContain('progress-bar-complete');

    fixture.componentRef.setInput('value', 120);
    fixture.detectChanges();

    expect(bar().value).toBe(100);
    expect(bar().classList).toContain('progress-bar-complete');
  });

  it('should be thin in the small size', () => {
    expect(bar().classList).not.toContain('progress-bar-sm');

    fixture.componentRef.setInput('size', 'sm');
    fixture.detectChanges();

    expect(bar().classList).toContain('progress-bar-sm');
  });
});
