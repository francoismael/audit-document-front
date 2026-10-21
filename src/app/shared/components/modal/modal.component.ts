import { Component, computed, input, output } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { ButtonComponent } from '../button/button.component';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { ModalSize, ModalVariant } from './modal.interface';

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [ButtonComponent, IconButtonComponent, MatIconModule],
  templateUrl: './modal.component.html',
  styleUrl: './modal.component.scss',
  host: {
    '(document:keydown.escape)': 'onEscape()'
  }
})
export class ModalComponent {
  readonly title = input.required<string>();
  // Short line under the title, for example the name of the edited item.
  readonly description = input<string>('');
  // Material icon shown next to the title. A danger modal shows a warning icon by default.
  readonly icon = input<string>('');
  readonly isOpen = input<boolean>(false);
  readonly confirmText = input<string>('Confirmer');
  readonly cancelText = input<string>('Annuler');
  readonly confirmVariant = input<ModalVariant>('primary');
  readonly size = input<ModalSize>('md');
  readonly loading = input<boolean>(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  readonly headerIcon = computed(() => this.icon() || (this.confirmVariant() === 'danger' ? 'warning_amber' : ''));

  onConfirm(): void {
    if (!this.loading()) {
      this.confirmed.emit();
    }
  }

  onCancel(): void {
    if (!this.loading()) {
      this.cancelled.emit();
    }
  }

  onBackdropClick(event: MouseEvent): void {
    if (event.target === event.currentTarget) {
      this.onCancel();
    }
  }

  onEscape(): void {
    if (this.isOpen()) {
      this.onCancel();
    }
  }
}
