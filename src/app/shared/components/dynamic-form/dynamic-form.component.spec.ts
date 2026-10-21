import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicField, DynamicFormValues } from '../../interfaces/dynamic-field.interface';
import { DynamicFormComponent } from './dynamic-form.component';

const FIELDS: DynamicField[] = [
  { name: 'motifs', label: 'Motifs', type: 'TEXTAREA', required: true },
  { name: 'montant', label: 'Montant', type: 'NUMBER', required: false },
  { name: 'dateEmission', label: 'Date d\'émission', type: 'DATE', required: true },
  { name: 'urgent', label: 'Urgent', type: 'BOOLEAN', required: true }
];

describe('DynamicFormComponent', () => {
  let component: DynamicFormComponent;
  let fixture: ComponentFixture<DynamicFormComponent>;
  let element: HTMLElement;
  let submitted: DynamicFormValues[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DynamicFormComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DynamicFormComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    submitted = [];
    component.formSubmit.subscribe((values) => submitted.push(values));

    fixture.componentRef.setInput('fields', FIELDS);
    fixture.detectChanges();
  });

  const submit = (): void => {
    element.querySelector('form')?.dispatchEvent(new Event('submit'));
    fixture.detectChanges();
  };

  const field = (name: string): DynamicField => FIELDS.find((item) => item.name === name) as DynamicField;

  const submitButton = (): HTMLButtonElement | null =>
    element.querySelector<HTMLButtonElement>('button[type="submit"]');

  it('should block the submit and flag the required fields', () => {
    submit();

    expect(submitted).toEqual([]);
    expect(component.errorFor(field('motifs'))).toBe('Ce champ est obligatoire.');
    expect(component.errorFor(field('dateEmission'))).toBe('Ce champ est obligatoire.');
    expect(element.textContent).toContain('Ce champ est obligatoire.');
  });

  it('should focus the first invalid field', () => {
    document.body.appendChild(element);

    submit();

    expect(document.activeElement?.id).toBe('dynamic-field-motifs');
    element.remove();
  });

  it('should only show errors after a submit attempt', () => {
    expect(component.errorFor(field('motifs'))).toBeNull();
    expect(element.textContent).not.toContain('Ce champ est obligatoire.');
  });

  it('should reject a value that is not a number', () => {
    component.updateValue(field('montant'), 'abc');
    submit();

    expect(component.errorFor(field('montant'))).toBe('Veuillez saisir un nombre valide.');
  });

  it('should submit every field, with an unchecked box sent as false', () => {
    component.updateValue(field('motifs'), 'Contrôle annuel');
    component.updateValue(field('montant'), '12.5');
    component.updateValue(field('dateEmission'), '2026-10-20');
    submit();

    expect(submitted).toEqual([
      { motifs: 'Contrôle annuel', montant: '12.5', dateEmission: '2026-10-20', urgent: false }
    ]);
  });

  it('should prefill the form with the initial values', () => {
    fixture.componentRef.setInput('initialValues', { motifs: 'Déjà saisi', urgent: true });
    fixture.detectChanges();

    expect(component.textValue(field('motifs'))).toBe('Déjà saisi');
    expect(component.isChecked(field('urgent'))).toBeTrue();
    expect(element.querySelector<HTMLTextAreaElement>('#dynamic-field-motifs')?.value).toBe('Déjà saisi');
  });

  it('should lock the form while loading', () => {
    component.updateValue(field('motifs'), 'Contrôle annuel');
    component.updateValue(field('dateEmission'), '2026-10-20');
    fixture.componentRef.setInput('loading', true);
    fixture.detectChanges();

    expect(submitButton()?.disabled).toBeTrue();
    expect(submitButton()?.textContent?.trim()).toBe('Traitement en cours...');
    expect(element.querySelector<HTMLTextAreaElement>('#dynamic-field-motifs')?.disabled).toBeTrue();

    submit();
    expect(submitted).toEqual([]);
  });

  it('should clear the values and the errors on reset', () => {
    fixture.componentRef.setInput('initialValues', { motifs: 'Déjà saisi' });
    fixture.detectChanges();
    submit();

    component.onReset();
    fixture.detectChanges();

    expect(component.textValue(field('motifs'))).toBe('');
    expect(component.errorFor(field('dateEmission'))).toBeNull();
  });
});
