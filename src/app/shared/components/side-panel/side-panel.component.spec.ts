import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SidePanelComponent } from './side-panel.component';

describe('SidePanelComponent', () => {
  let component: SidePanelComponent;
  let fixture: ComponentFixture<SidePanelComponent>;
  let element: HTMLElement;
  let closed: number;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SidePanelComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(SidePanelComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.componentRef.setInput('title', 'Fiche de suivi');
    fixture.componentRef.setInput('eyebrow', 'Type de document #1');
    fixture.detectChanges();

    closed = 0;
    component.closed.subscribe(() => closed++);
  });

  it('should show the eyebrow and the title', () => {
    expect(element.querySelector('h2')?.textContent).toContain('Fiche de suivi');
    expect(element.textContent).toContain('Type de document #1');
  });

  it('should close with the close button or a click on the backdrop, not on the panel', () => {
    element.querySelector<HTMLButtonElement>('button[aria-label="Fermer le panneau"]')?.click();
    element.querySelector<HTMLElement>('.side-panel')?.click();
    element.querySelector<HTMLElement>('.side-panel-backdrop')?.click();

    expect(closed).toBe(2);
  });

  it('should switch between the normal and the wide size', () => {
    element.querySelector<HTMLButtonElement>('button[aria-label="Agrandir le panneau"]')?.click();
    fixture.detectChanges();

    expect(element.querySelector('.side-panel')?.classList).toContain('side-panel-expanded');
  });
});
