import { Component, computed, input, linkedSignal, output } from '@angular/core';

import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { todayAsText } from '../../../missions/models/mission-labels';

@Component({
  selector: 'app-declaration-form-modal',
  standalone: true,
  imports: [FormFieldComponent, ModalComponent],
  templateUrl: './declaration-form-modal.component.html',
  styleUrl: './declaration-form-modal.component.scss'
})
export class DeclarationFormModalComponent {
  readonly open = input<boolean>(false);
  // Name of the person who declares, shown under the title.
  readonly declarant = input<string>('');
  // Date of an existing declaration; empty for a new one (today is proposed).
  readonly date = input<string>('');
  readonly saving = input<boolean>(false);

  readonly submitted = output<string>();
  readonly cancelled = output<void>();

  readonly dateDeclaration = linkedSignal(() => (this.open() ? this.date() || todayAsText() : ''));
  readonly showErrors = linkedSignal(() => {
    this.open();
    return false;
  });

  readonly title = computed(() => (this.date() ? 'Modifier la déclaration' : "Établir la déclaration d'indépendance"));
  readonly dateError = computed(() =>
    this.showErrors() && !this.dateDeclaration() ? 'La date de la déclaration est obligatoire.' : null
  );

  onConfirm(): void {
    this.showErrors.set(true);

    if (this.dateDeclaration()) {
      this.submitted.emit(this.dateDeclaration());
    }
  }
}
