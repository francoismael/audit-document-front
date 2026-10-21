import { Component, ElementRef, computed, inject, input, linkedSignal, output, signal } from '@angular/core';

import { ButtonComponent } from '../button/button.component';
import { CheckboxFieldComponent } from '../checkbox-field/checkbox-field.component';
import { FormFieldComponent } from '../form-field/form-field.component';
import { FormFieldType } from '../form-field/form-field.interface';
import { TextareaFieldComponent } from '../textarea-field/textarea-field.component';
import {
  DynamicField,
  DynamicFieldType,
  DynamicFieldValue,
  DynamicFormValues
} from '../../interfaces/dynamic-field.interface';

const INPUT_TYPES: Partial<Record<DynamicFieldType, FormFieldType>> = {
  TEXT: 'text',
  NUMBER: 'number',
  DATE: 'date'
};

const REQUIRED_MESSAGE = 'Ce champ est obligatoire.';
const NUMBER_MESSAGE = 'Veuillez saisir un nombre valide.';

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [
    ButtonComponent,
    CheckboxFieldComponent,
    FormFieldComponent,
    TextareaFieldComponent
  ],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss'
})
export class DynamicFormComponent {
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);

  readonly fields = input.required<DynamicField[]>();
  readonly initialValues = input<DynamicFormValues>({});
  readonly title = input<string>('');
  readonly description = input<string>('');
  readonly submitLabel = input<string>('Générer');
  readonly resetLabel = input<string>('Réinitialiser');
  readonly loading = input<boolean>(false);
  readonly loadingLabel = input<string>('Traitement en cours...');

  readonly formSubmit = output<DynamicFormValues>();

  // Rebuilt whenever the fields or the initial values change, then edited by the user.
  readonly values = linkedSignal(() => buildValues(this.fields(), this.initialValues()));
  readonly showErrors = signal<boolean>(false);

  private readonly errors = computed(() => {
    const values = this.values();
    const errors: Record<string, string | null> = {};

    for (const field of this.fields()) {
      errors[field.name] = validate(field, values[field.name]);
    }

    return errors;
  });

  inputType(field: DynamicField): FormFieldType {
    return INPUT_TYPES[field.type] ?? 'text';
  }

  textValue(field: DynamicField): string {
    const value = this.values()[field.name];

    return typeof value === 'string' ? value : '';
  }

  isChecked(field: DynamicField): boolean {
    return this.values()[field.name] === true;
  }

  errorFor(field: DynamicField): string | null {
    return this.showErrors() ? this.errors()[field.name] ?? null : null;
  }

  updateValue(field: DynamicField, value: DynamicFieldValue): void {
    this.values.update((values) => ({ ...values, [field.name]: value }));
  }

  onSubmit(event: Event): void {
    event.preventDefault();

    if (this.loading()) {
      return;
    }

    this.showErrors.set(true);

    const firstInvalidField = this.fields().find((field) => this.errors()[field.name]);

    if (firstInvalidField) {
      this.focusField(firstInvalidField);
      return;
    }

    this.formSubmit.emit(this.values());
  }

  onReset(): void {
    this.values.set(buildValues(this.fields(), {}));
    this.showErrors.set(false);
  }

  private focusField(field: DynamicField): void {
    this.host.nativeElement
      .querySelector<HTMLElement>(`#dynamic-field-${CSS.escape(field.name)}`)
      ?.focus();
  }
}

// Every field gets a value: a checkbox is always true or false, so an unchecked box is sent as "Non".
function buildValues(fields: DynamicField[], initialValues: DynamicFormValues): DynamicFormValues {
  const values: DynamicFormValues = {};

  for (const field of fields) {
    const initialValue = initialValues[field.name];

    values[field.name] =
      field.type === 'BOOLEAN' ? initialValue === true : typeof initialValue === 'string' ? initialValue : '';
  }

  return values;
}

function validate(field: DynamicField, value: DynamicFieldValue | undefined): string | null {
  // Unchecked is a valid answer for a yes/no field.
  if (field.type === 'BOOLEAN') {
    return null;
  }

  const text = typeof value === 'string' ? value.trim() : '';

  if (!text) {
    return field.required ? REQUIRED_MESSAGE : null;
  }

  if (field.type === 'NUMBER' && !Number.isFinite(Number(text))) {
    return NUMBER_MESSAGE;
  }

  return null;
}
