import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StatusBadgeComponent } from './status-badge.component';

describe('StatusBadgeComponent', () => {
  let component: StatusBadgeComponent;
  let fixture: ComponentFixture<StatusBadgeComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StatusBadgeComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(StatusBadgeComponent);
    component = fixture.componentInstance;
    fixture.componentRef.setInput('status', 'pending');

    fixture.detectChanges();
  });

  it('should show the default label of the status', () => {
    expect(fixture.nativeElement.textContent.trim()).toBe('En attente');
  });

  it('should show a custom label while keeping the status colors', () => {
    fixture.componentRef.setInput('status', 'approved');
    fixture.componentRef.setInput('label', 'Actif');
    fixture.detectChanges();

    const badge: HTMLElement = fixture.nativeElement.querySelector('.status-badge');
    expect(badge.textContent?.trim()).toBe('Actif');
    expect(badge.classList).toContain('status-badge-approved');
    expect(component.label()).toBe('Actif');
  });
});
