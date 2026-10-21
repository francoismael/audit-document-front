import { Component, computed, input, linkedSignal, output } from '@angular/core';

import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { TextareaFieldComponent } from '../../../../shared/components/textarea-field/textarea-field.component';
import { DocumentType, DocumentTypeRequest } from '../../models/document-type.model';

const CODE_PATTERN = /^[A-Za-z0-9_-]+$/;
// Column sizes of the document_type table.
const CODE_MAX_LENGTH = 100;
const NAME_MAX_LENGTH = 255;

@Component({
  selector: 'app-document-type-form-modal',
  standalone: true,
  imports: [FormFieldComponent, ModalComponent, TextareaFieldComponent],
  templateUrl: './document-type-form-modal.component.html',
  styleUrl: './document-type-form-modal.component.scss'
})
export class DocumentTypeFormModalComponent {
  readonly open = input<boolean>(false);
  // Null to create a new type, a document type to edit it.
  readonly documentType = input<DocumentType | null>(null);
  readonly saving = input<boolean>(false);

  readonly submitted = output<DocumentTypeRequest>();
  readonly cancelled = output<void>();

  // Reset every time the modal opens, from the edited type or empty.
  readonly code = linkedSignal(() => (this.open() ? this.documentType()?.code ?? '' : ''));
  readonly nom = linkedSignal(() => (this.open() ? this.documentType()?.nom ?? '' : ''));
  readonly description = linkedSignal(() => (this.open() ? this.documentType()?.description ?? '' : ''));
  readonly showErrors = linkedSignal(() => {
    this.open();
    return false;
  });

  readonly title = computed(() =>
    this.documentType() ? 'Modifier le type de document' : 'Créer un type de document'
  );

  readonly subtitle = computed(() =>
    this.documentType()
      ? `Code ${this.documentType()?.code}`
      : 'Il sera proposé dans le catalogue une fois son modèle Word et ses champs ajoutés.'
  );
  readonly confirmText = computed(() => (this.documentType() ? 'Enregistrer' : 'Créer'));

  readonly codeError = computed(() => {
    const code = this.code().trim();

    if (!code) {
      return 'Le code est obligatoire.';
    }

    if (!CODE_PATTERN.test(code)) {
      return 'Lettres, chiffres, tirets (-) et soulignés (_) uniquement, sans espace.';
    }

    return code.length > CODE_MAX_LENGTH ? `${CODE_MAX_LENGTH} caractères maximum.` : null;
  });

  readonly nomError = computed(() => {
    const nom = this.nom().trim();

    if (!nom) {
      return 'Le nom est obligatoire.';
    }

    return nom.length > NAME_MAX_LENGTH ? `${NAME_MAX_LENGTH} caractères maximum.` : null;
  });

  readonly visibleCodeError = computed(() => (this.showErrors() ? this.codeError() : null));
  readonly visibleNomError = computed(() => (this.showErrors() ? this.nomError() : null));

  onConfirm(): void {
    this.showErrors.set(true);

    if (this.codeError() || this.nomError()) {
      return;
    }

    this.submitted.emit({
      code: this.code().trim(),
      nom: this.nom().trim(),
      description: this.description().trim() || null
    });
  }
}
