
import { Component, input, output } from '@angular/core';

import { SelectFieldConfig } from './select-field.interface';

@Component({
  selector: 'app-select-field',
  standalone: true,
  templateUrl: './select-field.component.html',
  styleUrl: './select-field.component.scss'
})
export class SelectFieldComponent {
  readonly config = input.required<SelectFieldConfig>();
  readonly id = input.required<string>();
  readonly value = input<string>('');
  readonly invalid = input<boolean>(false);

  readonly valueChange = output<string>();

  onValueChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLSelectElement) {
      this.valueChange.emit(target.value);
    }
  }

  get errorMessage(): string {
    return this.config().errorMessage ?? 'Veuillez sélectionner une option.';
  }
}
