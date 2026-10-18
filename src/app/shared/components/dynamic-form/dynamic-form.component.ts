import { Component, input, output, signal } from '@angular/core';

import { ButtonComponent } from '../button/button.component';
import { CheckboxFieldComponent } from '../checkbox-field/checkbox-field.component';
import { FormFieldComponent } from '../form-field/form-field.component';
import { FormFieldType } from '../form-field/form-field.interface';
import { SelectFieldComponent } from '../select-field/select-field.component';
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
  EMAIL: 'email',
  DATE: 'date'
};

@Component({
  selector: 'app-dynamic-form',
  standalone: true,
  imports: [
    ButtonComponent,
    CheckboxFieldComponent,
    FormFieldComponent,
    SelectFieldComponent,
    TextareaFieldComponent
  ],
  templateUrl: './dynamic-form.component.html',
  styleUrl: './dynamic-form.component.scss'
})
export class DynamicFormComponent {
  readonly fields = input.required<DynamicField[]>();
  readonly title = input<string>('');
  readonly description = input<string>('');
  readonly submitLabel = input<string>('Générer');
  readonly resetLabel = input<string>('Réinitialiser');

  readonly formSubmit = output<DynamicFormValues>();

  readonly values = signal<DynamicFormValues>({});
  readonly showErrors = signal<boolean>(false);

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

  isInvalid(field: DynamicField): boolean {
    return this.showErrors() && field.required && this.isEmpty(field);
  }

  updateValue(field: DynamicField, value: DynamicFieldValue): void {
    this.values.update((values) => ({ ...values, [field.name]: value }));
  }

  onSubmit(event: Event): void {
    event.preventDefault();
    this.showErrors.set(true);

    const hasErrors = this.fields().some((field) => this.isInvalid(field));

    if (!hasErrors) {
      this.formSubmit.emit(this.values());
    }
  }

  onReset(): void {
    this.values.set({});
    this.showErrors.set(false);
  }

  private isEmpty(field: DynamicField): boolean {
    const value = this.values()[field.name];

    return typeof value === 'string' ? value.trim() === '' : value !== true;
  }
}
