import { Component, inject, signal } from '@angular/core';

import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DocumentPreviewComponent } from '../../../../shared/components/document-preview/document-preview.component';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import {
  DynamicField,
  DynamicFormValues
} from '../../../../shared/interfaces/dynamic-field.interface';

// Données de démonstration, à remplacer par l'appel API des champs du type de document.
const FICHE_DE_SUIVI_FIELDS: DynamicField[] = [
  { name: 'motifs', label: 'Motifs', type: 'TEXTAREA', required: true, placeholder: 'Saisissez les motifs...' },
  { name: 'nature', label: 'Nature', type: 'TEXT', required: false, placeholder: 'Saisissez la nature...' },
  { name: 'dateEmission', label: "Date d'émission", type: 'DATE', required: true },
  { name: 'version', label: 'Version', type: 'TEXT', required: true, placeholder: 'Saisissez la version...' }
];

@Component({
  selector: 'app-document-generate',
  standalone: true,
  imports: [ButtonComponent, DocumentPreviewComponent, DynamicFormComponent, PageHeaderComponent],
  templateUrl: './document-generate.component.html',
  styleUrl: './document-generate.component.scss'
})
export class DocumentGenerateComponent {
  private readonly toastService = inject(ToastService);

  readonly documentTitle = 'Fiche de suivi';
  readonly fields = FICHE_DE_SUIVI_FIELDS;
  readonly values = signal<DynamicFormValues | null>(null);

  onGenerate(values: DynamicFormValues): void {
    this.values.set(values);
    this.toastService.success('Document généré avec succès !');
  }

  onEdit(): void {
    this.values.set(null);
  }

  onDownload(): void {
    this.toastService.info('Le téléchargement sera disponible une fois l\'API connectée.');
  }
}
