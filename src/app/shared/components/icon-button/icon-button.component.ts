import { Component, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { IconButtonVariant } from './icon-button.interface';

// Compact action button for lists: a Material icon, with the label as tooltip and accessible name.
@Component({
  selector: 'app-icon-button',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './icon-button.component.html',
  styleUrl: './icon-button.component.scss'
})
export class IconButtonComponent {
  // Material icon name, see https://fonts.google.com/icons
  readonly icon = input.required<string>();
  readonly label = input.required<string>();
  readonly variant = input<IconButtonVariant>('default');
  readonly disabled = input<boolean>(false);

  readonly clicked = output<MouseEvent>();

  onClick(event: MouseEvent): void {
    if (!this.disabled()) {
      this.clicked.emit(event);
    }
  }
}
