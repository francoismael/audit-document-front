import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ModalComponent } from './modal.component';

describe('ModalComponent', () => {
  let component: ModalComponent;
  let fixture: ComponentFixture<ModalComponent>;
  let element: HTMLElement;
  let confirmed: number;
  let cancelled: number;

  const buttonByText = (text: string): HTMLButtonElement | undefined =>
    Array.from(element.querySelectorAll<HTMLButtonElement>('.modal-actions button')).find(
      (button) => button.textContent?.trim() === text
    );

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ModalComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.componentRef.setInput('title', 'Supprimer le champ');
    fixture.componentRef.setInput('isOpen', true);
    fixture.detectChanges();

    confirmed = 0;
    cancelled = 0;
    component.confirmed.subscribe(() => confirmed++);
    component.cancelled.subscribe(() => cancelled++);
  });

  it('should render nothing while closed', () => {
    fixture.componentRef.setInput('isOpen', false);
    fixture.detectChanges();

    expect(element.querySelector('[role="dialog"]')).toBeNull();
  });

  it('should show a warning icon and a danger button for a danger modal', () => {
    fixture.componentRef.setInput('confirmVariant', 'danger');
    fixture.componentRef.setInput('confirmText', 'Supprimer');
    fixture.componentRef.setInput('description', 'Date de début');
    fixture.detectChanges();

    expect(element.querySelector('.modal-icon')?.textContent).toContain('warning_amber');
    expect(element.querySelector('.modal-description')?.textContent).toContain('Date de début');
    expect(buttonByText('Supprimer')?.classList).toContain('button-danger');
  });

  it('should confirm, and cancel with the buttons, the backdrop or Escape', () => {
    buttonByText('Confirmer')?.click();
    buttonByText('Annuler')?.click();
    element.querySelector<HTMLElement>('.modal-backdrop')?.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(confirmed).toBe(1);
    expect(cancelled).toBe(3);
  });

  it('should block every action while loading', () => {
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    buttonByText('Traitement...')?.click();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape' }));

    expect(confirmed).toBe(0);
    expect(cancelled).toBe(0);
  });
});
