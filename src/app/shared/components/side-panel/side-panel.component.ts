import { Component, input, output, signal } from '@angular/core';

import { IconButtonComponent } from '../icon-button/icon-button.component';

// Drawer that slides in from the right, over the page, to show the detail of a list item.
// Slots: [panel-badges] under the title, [panel-tabs] under the header, [panel-footer] for the main actions.
@Component({
  selector: 'app-side-panel',
  standalone: true,
  imports: [IconButtonComponent],
  templateUrl: './side-panel.component.html',
  styleUrl: './side-panel.component.scss'
})
export class SidePanelComponent {
  readonly title = input.required<string>();
  // Small label above the title, for example "Type de document #2".
  readonly eyebrow = input<string>('');

  readonly closed = output<void>();

  readonly expanded = signal<boolean>(false);

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.closed.emit();
    }
  }
}
