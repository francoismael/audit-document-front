
import { Component, input, output } from '@angular/core';

import {
  FormFieldConfig,
  FormFieldType
} from './form-field.interface';

@Component({
  selector: 'app-form-field',
  standalone: true,
  templateUrl: './form-field.component.html',
  styleUrl: './form-field.component.scss'
})
export class FormFieldComponent {
  readonly config = input.required<FormFieldConfig>();
  readonly id = input.required<string>();
  readonly value = input<string | number>('');
  readonly invalid = input<boolean>(false);

  readonly valueChange = output<string>();

  get fieldType(): FormFieldType {
    return this.config().type;
  }

  get errorMessage(): string {
    return this.config().errorMessage ?? 'Ce champ est invalide.';
  }

  onValueInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement) {
      this.valueChange.emit(target.value);
    }
  }
}
