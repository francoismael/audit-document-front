import { Component, computed, input, linkedSignal, output } from '@angular/core';

import { CheckboxFieldComponent } from '../../../../shared/components/checkbox-field/checkbox-field.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SelectFieldComponent } from '../../../../shared/components/select-field/select-field.component';
import { SelectFieldOption } from '../../../../shared/components/select-field/select-field.interface';
import { DYNAMIC_FIELD_TYPE_LABELS, DynamicFieldType } from '../../../../shared/interfaces/dynamic-field.interface';
import { DocumentField, DocumentFieldRequest } from '../../models/document-field.model';

// Same pattern as the {{ variables }} of a Word template.
const NAME_PATTERN = /^[A-Za-z0-9_]+$/;
// Column sizes of the document_field table.
const NAME_MAX_LENGTH = 100;
const LABEL_MAX_LENGTH = 255;

@Component({
  selector: 'app-document-field-form-modal',
  standalone: true,
  imports: [CheckboxFieldComponent, FormFieldComponent, ModalComponent, SelectFieldComponent],
  templateUrl: './document-field-form-modal.component.html',
  styleUrl: './document-field-form-modal.component.scss'
})
export class DocumentFieldFormModalComponent {
  readonly open = input<boolean>(false);
  readonly documentTypeId = input.required<number>();
  // Null to add a new field, a field to edit it.
  readonly field = input<DocumentField | null>(null);
  // Names already used by the other fields of the type.
  readonly takenNames = input<string[]>([]);
  readonly saving = input<boolean>(false);

  readonly submitted = output<DocumentFieldRequest>();
  readonly cancelled = output<void>();

  readonly typeOptions: SelectFieldOption[] = Object.entries(DYNAMIC_FIELD_TYPE_LABELS).map(([value, label]) => ({
    value,
    label
  }));

  // Reset every time the modal opens, from the edited field or empty.
  readonly nom = linkedSignal(() => (this.open() ? this.field()?.nom ?? '' : ''));
  readonly libelle = linkedSignal(() => (this.open() ? this.field()?.libelle ?? '' : ''));
  readonly type = linkedSignal<string>(() => (this.open() ? this.field()?.type ?? '' : ''));
  readonly obligatoire = linkedSignal(() => (this.open() ? this.field()?.obligatoire ?? false : false));
  readonly showErrors = linkedSignal(() => {
    this.open();
    return false;
  });

  readonly title = computed(() => (this.field() ? 'Modifier le champ' : 'Ajouter un champ'));
  readonly subtitle = computed(() => this.field()?.libelle ?? 'Le champ sera ajouté à la fin du formulaire.');
  readonly confirmText = computed(() => (this.field() ? 'Enregistrer' : 'Ajouter'));
  readonly templateVariable = computed(() => `{{ ${this.nom().trim() || 'nom_technique'} }}`);

  readonly nomError = computed(() => {
    const nom = this.nom().trim();

    if (!nom) {
      return 'Le nom technique est obligatoire.';
    }

    if (!NAME_PATTERN.test(nom)) {
      return 'Lettres, chiffres et soulignés (_) uniquement, sans espace ni accent.';
    }

    if (nom.length > NAME_MAX_LENGTH) {
      return `${NAME_MAX_LENGTH} caractères maximum.`;
    }

    const taken = this.takenNames().some((name) => name.toLowerCase() === nom.toLowerCase());
    return taken ? 'Un autre champ porte déjà ce nom.' : null;
  });

  readonly libelleError = computed(() => {
    const libelle = this.libelle().trim();

    if (!libelle) {
      return 'Le libellé est obligatoire.';
    }

    return libelle.length > LABEL_MAX_LENGTH ? `${LABEL_MAX_LENGTH} caractères maximum.` : null;
  });

  readonly typeError = computed(() => (this.type() ? null : 'Choisissez le type du champ.'));

  readonly visibleNomError = computed(() => (this.showErrors() ? this.nomError() : null));
  readonly visibleLibelleError = computed(() => (this.showErrors() ? this.libelleError() : null));
  readonly visibleTypeError = computed(() => (this.showErrors() ? this.typeError() : null));

  onConfirm(): void {
    this.showErrors.set(true);

    if (this.nomError() || this.libelleError() || this.typeError()) {
      return;
    }

    this.submitted.emit({
      documentTypeId: this.documentTypeId(),
      nom: this.nom().trim(),
      libelle: this.libelle().trim(),
      type: this.type() as DynamicFieldType,
      obligatoire: this.obligatoire()
    });
  }
}
