import { Component, input, output } from '@angular/core';

import { TextareaFieldConfig } from './textarea-field.interface';

@Component({
  selector: 'app-textarea-field',
  standalone: true,
  templateUrl: './textarea-field.component.html',
  styleUrl: './textarea-field.component.scss'
})
export class TextareaFieldComponent {
  readonly config = input.required<TextareaFieldConfig>();
  readonly id = input.required<string>();
  readonly value = input<string>('');
  readonly invalid = input<boolean>(false);

  readonly valueChange = output<string>();

  onValueInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLTextAreaElement) {
      this.valueChange.emit(target.value);
    }
  }

  get errorMessage(): string {
    return this.config().errorMessage
      ?? 'Veuillez renseigner ce champ.';
  }
}
