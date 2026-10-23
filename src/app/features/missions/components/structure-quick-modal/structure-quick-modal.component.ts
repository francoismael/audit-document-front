import { Component, computed, input, linkedSignal, output } from '@angular/core';

import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { TextareaFieldComponent } from '../../../../shared/components/textarea-field/textarea-field.component';
import { StructureRequest } from '../../models/structure.model';

// Size of the nom column.
const NAME_MAX_LENGTH = 255;

@Component({
  selector: 'app-structure-quick-modal',
  standalone: true,
  imports: [FormFieldComponent, ModalComponent, TextareaFieldComponent],
  templateUrl: './structure-quick-modal.component.html',
  styleUrl: './structure-quick-modal.component.scss'
})
export class StructureQuickModalComponent {
  readonly open = input<boolean>(false);
  readonly saving = input<boolean>(false);

  readonly submitted = output<StructureRequest>();
  readonly cancelled = output<void>();

  // Emptied every time the modal opens.
  readonly nom = linkedSignal(() => this.emptyOnOpen());
  readonly descriptions = linkedSignal(() => this.emptyOnOpen());
  readonly showErrors = linkedSignal(() => {
    this.open();
    return false;
  });

  readonly nomError = computed(() => {
    const nom = this.nom().trim();

    if (!nom) {
      return 'Le nom de la structure est obligatoire.';
    }

    return nom.length > NAME_MAX_LENGTH ? `${NAME_MAX_LENGTH} caractères maximum.` : null;
  });

  readonly visibleNomError = computed(() => (this.showErrors() ? this.nomError() : null));

  onConfirm(): void {
    this.showErrors.set(true);

    if (this.nomError()) {
      return;
    }

    this.submitted.emit({
      nom: this.nom().trim(),
      descriptions: this.descriptions().trim() || null
    });
  }

  private emptyOnOpen(): string {
    this.open();
    return '';
  }
}
