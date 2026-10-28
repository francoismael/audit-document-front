import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { injectActionRunner } from '../../../../core/http/action-runner';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DocumentSheetComponent } from '../../../../shared/components/document-sheet/document-sheet.component';
import { DocumentToolbarComponent } from '../../../../shared/components/document-toolbar/document-toolbar.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { SelectFieldComponent } from '../../../../shared/components/select-field/select-field.component';
import { SelectFieldOption } from '../../../../shared/components/select-field/select-field.interface';
import { TextareaFieldComponent } from '../../../../shared/components/textarea-field/textarea-field.component';
import { ordreMissionReference, todayAsText } from '../../../missions/models/mission-labels';
import {
  RAPPORT_CLASSIFICATIONS,
  RAPPORT_VERSION_LABELS,
  RapportAuditRequest,
  RapportVersion
} from '../../models/rapport-audit.model';
import { AuditFileStore } from '../../services/audit-file.store';
import { RapportAuditService } from '../../services/rapport-audit.service';

interface RapportDraft {
  motifs: string;
  nature: string;
  versionRapport: RapportVersion;
  dateEmission: string;
  proprietaireDocument: string;
  destinataires: string;
  classification: string;
}

// Cover page of the audit report (Document.docx). One report per mission, never deleted.
@Component({
  selector: 'app-rapport-document',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    DocumentSheetComponent,
    DocumentToolbarComponent,
    EmptyStateComponent,
    FormFieldComponent,
    SelectFieldComponent,
    TextareaFieldComponent
  ],
  templateUrl: './rapport-document.component.html',
  styleUrl: './rapport-document.component.scss'
})
export class RapportDocumentComponent {
  private readonly rapportService = inject(RapportAuditService);
  private readonly toastService = inject(ToastService);
  private readonly runAction = injectActionRunner();
  readonly store = inject(AuditFileStore);

  readonly mission = this.store.mission;
  readonly rapport = this.store.rapport;
  readonly classifications = RAPPORT_CLASSIFICATIONS;

  readonly versionOptions: SelectFieldOption[] = (Object.keys(RAPPORT_VERSION_LABELS) as RapportVersion[]).map(
    (version) => ({ value: version, label: RAPPORT_VERSION_LABELS[version] })
  );

  readonly editing = signal<boolean>(false);
  readonly draft = signal<RapportDraft>(this.emptyDraft());
  readonly saving = signal<boolean>(false);

  // A classification saved outside the three of Document.docx stays selectable.
  readonly classificationOptions = computed<SelectFieldOption[]>(() => {
    const current = this.draft().classification;
    const values = current && !RAPPORT_CLASSIFICATIONS.includes(current) ? [...RAPPORT_CLASSIFICATIONS, current] : RAPPORT_CLASSIFICATIONS;
    return values.map((value) => ({ value, label: value }));
  });

  readonly omReference = computed(() => {
    const mission = this.mission();
    return mission ? ordreMissionReference(mission) : '';
  });

  readonly destinataires = computed(() =>
    (this.rapport()?.destinataires ?? '')
      .split('\n')
      .map((line) => line.trim())
      .filter((line) => line.length > 0)
  );

  // "definitif" → "définitif"; a free value is shown as it is.
  readonly versionLabel = computed(() => {
    const version = this.rapport()?.versionRapport ?? '';
    return version in RAPPORT_VERSION_LABELS ? RAPPORT_VERSION_LABELS[version as RapportVersion].toLowerCase() : version;
  });

  startEditing(): void {
    const rapport = this.rapport();

    this.draft.set(
      rapport
        ? {
            motifs: rapport.motifs ?? '',
            nature: rapport.nature ?? '',
            versionRapport: rapport.versionRapport === 'provisoire' ? 'provisoire' : 'definitif',
            dateEmission: rapport.dateEmission ?? '',
            proprietaireDocument: rapport.proprietaireDocument ?? '',
            destinataires: rapport.destinataires ?? '',
            classification: rapport.classification ?? ''
          }
        : this.emptyDraft()
    );
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
  }

  updateField<K extends keyof RapportDraft>(field: K, value: RapportDraft[K]): void {
    this.draft.update((draft) => ({ ...draft, [field]: value }));
  }

  updateVersion(value: string): void {
    this.updateField('versionRapport', value === 'provisoire' ? 'provisoire' : 'definitif');
  }

  save(): void {
    const mission = this.mission();

    if (!mission) {
      return;
    }

    const draft = this.draft();
    const text = (value: string): string | null => value.trim() || null;
    const request: RapportAuditRequest = {
      missionId: mission.id,
      motifs: text(draft.motifs),
      nature: text(draft.nature),
      versionRapport: draft.versionRapport,
      dateEmission: draft.dateEmission || null,
      proprietaireDocument: text(draft.proprietaireDocument),
      destinataires: text(draft.destinataires),
      classification: draft.classification || null
    };

    const existing = this.rapport();
    const save$ = existing ? this.rapportService.update(existing.rapportId, request) : this.rapportService.create(request);

    this.runAction(save$, this.saving, (rapport) => {
      this.store.rapport.set(rapport);
      this.editing.set(false);
      this.toastService.success(existing ? "Le rapport d'audit a été modifié." : "Le rapport d'audit a été créé.");
    });
  }

  // Starting values of a new report: the cover page of Document.docx.
  private emptyDraft(): RapportDraft {
    const structure = this.mission()?.structureNom;

    return {
      motifs: '',
      nature: '',
      versionRapport: 'provisoire',
      dateEmission: todayAsText(),
      proprietaireDocument: "Direction de l'Audit Interne",
      destinataires: structure ? `Autorités Supérieures\n${structure}` : 'Autorités Supérieures',
      classification: RAPPORT_CLASSIFICATIONS[0]
    };
  }
}
