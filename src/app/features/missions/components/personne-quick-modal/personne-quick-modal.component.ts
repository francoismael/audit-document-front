import { Component, computed, input, linkedSignal, output } from '@angular/core';

import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PersonneRequest } from '../../models/personne.model';

@Component({
  selector: 'app-personne-quick-modal',
  standalone: true,
  imports: [FormFieldComponent, ModalComponent],
  templateUrl: './personne-quick-modal.component.html',
  styleUrl: './personne-quick-modal.component.scss'
})
export class PersonneQuickModalComponent {
  readonly open = input<boolean>(false);
  readonly saving = input<boolean>(false);

  readonly submitted = output<PersonneRequest>();
  readonly cancelled = output<void>();

  // Emptied every time the modal opens.
  readonly nom = linkedSignal(() => this.emptyOnOpen());
  readonly prenom = linkedSignal(() => this.emptyOnOpen());
  readonly matricule = linkedSignal(() => this.emptyOnOpen());
  readonly fonction = linkedSignal(() => this.emptyOnOpen());
  readonly services = linkedSignal(() => this.emptyOnOpen());
  readonly showErrors = linkedSignal(() => {
    this.open();
    return false;
  });

  readonly visibleNomError = computed(() =>
    this.showErrors() && !this.nom().trim() ? 'Le nom est obligatoire.' : null
  );
  readonly visiblePrenomError = computed(() =>
    this.showErrors() && !this.prenom().trim() ? 'Le prénom est obligatoire.' : null
  );

  onConfirm(): void {
    this.showErrors.set(true);

    if (!this.nom().trim() || !this.prenom().trim()) {
      return;
    }

    this.submitted.emit({
      nom: this.nom().trim(),
      prenom: this.prenom().trim(),
      matricule: this.matricule().trim() || null,
      fonction: this.fonction().trim() || null,
      services: this.services().trim() || null
    });
  }

  private emptyOnOpen(): string {
    this.open();
    return '';
  }
}
