import { Component, DestroyRef, effect, inject, input, output } from '@angular/core';

import { ButtonComponent } from '../button/button.component';
import { IconButtonComponent } from '../icon-button/icon-button.component';
import { ScrollNavigatorComponent } from '../scroll-navigator/scroll-navigator.component';
import { ModalSize, ModalVariant } from './modal.interface';

// Open modals, the most recent last: Escape only closes the one on top (a quick creation over a form).
const openModals: ModalComponent[] = [];

@Component({
  selector: 'app-modal',
  standalone: true,
  imports: [ButtonComponent, IconButtonComponent, ScrollNavigatorComponent],
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
  readonly isOpen = input<boolean>(false);
  readonly confirmText = input<string>('Confirmer');
  readonly cancelText = input<string>('Annuler');
  readonly confirmVariant = input<ModalVariant>('primary');
  readonly size = input<ModalSize>('md');
  readonly loading = input<boolean>(false);

  readonly confirmed = output<void>();
  readonly cancelled = output<void>();

  constructor() {
    effect(() => {
      if (this.isOpen()) {
        openModals.push(this);
      } else {
        this.removeFromOpenModals();
      }
    });

    inject(DestroyRef).onDestroy(() => this.removeFromOpenModals());
  }

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
    if (this.isOpen() && openModals[openModals.length - 1] === this) {
      this.onCancel();
    }
  }

  private removeFromOpenModals(): void {
    const index = openModals.indexOf(this);

    if (index >= 0) {
      openModals.splice(index, 1);
    }
  }
}
