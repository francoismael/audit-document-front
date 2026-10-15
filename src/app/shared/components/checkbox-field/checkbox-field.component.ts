
import { Component, input, output } from '@angular/core';

import { CheckboxFieldConfig } from './checkbox-field.interface';

@Component({
  selector: 'app-checkbox-field',
  standalone: true,
  templateUrl: './checkbox-field.component.html',
  styleUrl: './checkbox-field.component.scss'
})
export class CheckboxFieldComponent {
  readonly config = input.required<CheckboxFieldConfig>();
  readonly id = input.required<string>();
  readonly checked = input<boolean>(false);
  readonly invalid = input<boolean>(false);

  readonly valueChange = output<boolean>();

  onValueChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.valueChange.emit(target.checked);
    }
  }

  get errorMessage(): string {
    return this.config().errorMessage ?? 'Cette case doit être cochée.';
  }
}
