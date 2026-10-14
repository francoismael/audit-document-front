
import { Component, input, output } from '@angular/core';

import {
  ButtonSize,
  ButtonType,
  ButtonVariant
} from './button.interface';

@Component({
  selector: 'app-button',
  standalone: true,
  templateUrl: './button.component.html',
  styleUrl: './button.component.scss'
})
export class ButtonComponent {
  readonly variant = input<ButtonVariant>('primary');
  readonly size = input<ButtonSize>('md');
  readonly type = input<ButtonType>('button');
  readonly disabled = input<boolean>(false);
  readonly fullWidth = input<boolean>(false);

  readonly clicked = output<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (!this.disabled()) {
      this.clicked.emit(event);
    }
  }
}
