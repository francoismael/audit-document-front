import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';

import { injectActionRunner } from '../../../../core/http/action-runner';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DocumentSheetComponent } from '../../../../shared/components/document-sheet/document-sheet.component';
import { DocumentToolbarComponent } from '../../../../shared/components/document-toolbar/document-toolbar.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { TextareaFieldComponent } from '../../../../shared/components/textarea-field/textarea-field.component';
import { todayAsText } from '../../../missions/models/mission-labels';
import { ObjectifRequest, Tdr, TdrRequest } from '../../models/tdr.model';
import { AuditFileStore } from '../../services/audit-file.store';
import { TdrService } from '../../services/tdr.service';

type TdrTextField =
  | 'dateTdr'
  | 'contexte'
  | 'competence'
  | 'perimetre'
  | 'periodeObservation'
  | 'lieu'
  | 'methodologieTravail'
  | 'resultatsAttendus'
  | 'livrables';

type TdrDraft = Record<TdrTextField, string>;

// Starting text of a new TDR, from the guidance of Document.docx.
const NEW_TDR_DRAFT: TdrDraft = {
  dateTdr: '',
  contexte: '',
  competence: '',
  perimetre: '',
  periodeObservation: '',
  lieu: '',
  methodologieTravail:
    "Phase I : Prise de connaissance de l'entité\n\n" +
    "Phase II : Réalisation de la mission d'audit\n\n" +
    "Phase III : Conclusion de la mission d'audit\n",
  resultatsAttendus: '',
  livrables: 'Rapport à adresser au Ministère (donneur d\'ordre).'
};

@Component({
  selector: 'app-tdr-document',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    DocumentSheetComponent,
    DocumentToolbarComponent,
    EmptyStateComponent,
    FormFieldComponent,
    IconButtonComponent,
    ModalComponent,
    TextareaFieldComponent
  ],
  templateUrl: './tdr-document.component.html',
  styleUrl: './tdr-document.component.scss'
})
export class TdrDocumentComponent {
  private readonly tdrService = inject(TdrService);
  private readonly toastService = inject(ToastService);
  private readonly runAction = injectActionRunner();
  readonly store = inject(AuditFileStore);

  readonly mission = this.store.mission;
  readonly tdr = this.store.tdr;

  readonly editing = signal<boolean>(false);
  readonly draft = signal<TdrDraft>({ ...NEW_TDR_DRAFT });
  readonly objectifs = signal<ObjectifRequest[]>([]);
  readonly showErrors = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly confirmingDeletion = signal<boolean>(false);
  readonly deleting = signal<boolean>(false);

  readonly objectifsError = computed(() =>
    this.objectifs().some((objectif) => !objectif.descriptions.trim())
      ? 'Chaque objectif doit avoir une description (ou retirez-le).'
      : null
  );

  readonly visibleObjectifsError = computed(() => (this.showErrors() ? this.objectifsError() : null));

  startEditing(): void {
    const tdr = this.tdr();

    this.draft.set(tdr ? this.toDraft(tdr) : { ...NEW_TDR_DRAFT, dateTdr: todayAsText() });
    this.objectifs.set(
      tdr ? tdr.objectifs.map((objectif) => ({ id: objectif.id, descriptions: objectif.descriptions })) : [{ id: null, descriptions: '' }]
    );
    this.showErrors.set(false);
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
  }

  updateField(field: TdrTextField, value: string): void {
    this.draft.update((draft) => ({ ...draft, [field]: value }));
  }

  addObjectif(): void {
    this.objectifs.update((objectifs) => [...objectifs, { id: null, descriptions: '' }]);
  }

  updateObjectif(index: number, descriptions: string): void {
    this.objectifs.update((objectifs) =>
      objectifs.map((objectif, position) => (position === index ? { ...objectif, descriptions } : objectif))
    );
  }

  removeObjectif(index: number): void {
    this.objectifs.update((objectifs) => objectifs.filter((_, position) => position !== index));
  }

  save(): void {
    const mission = this.mission();
    this.showErrors.set(true);

    if (!mission || this.objectifsError()) {
      return;
    }

    const draft = this.draft();
    const request: TdrRequest = {
      missionId: mission.id,
      contexte: draft.contexte.trim() || null,
      competence: draft.competence.trim() || null,
      perimetre: draft.perimetre.trim() || null,
      periodeObservation: draft.periodeObservation.trim() || null,
      lieu: draft.lieu.trim() || null,
      methodologieTravail: draft.methodologieTravail.trim() || null,
      resultatsAttendus: draft.resultatsAttendus.trim() || null,
      livrables: draft.livrables.trim() || null,
      dateTdr: draft.dateTdr || null,
      objectifs: this.objectifs().map((objectif) => ({ ...objectif, descriptions: objectif.descriptions.trim() }))
    };

    const existing = this.tdr();
    const save$ = existing ? this.tdrService.update(existing.id, request) : this.tdrService.create(request);

    this.runAction(save$, this.saving, (tdr) => {
      this.store.tdr.set(tdr);
      this.editing.set(false);
      this.toastService.success(existing ? 'Les termes de référence ont été modifiés.' : 'Les termes de référence ont été créés.');
    });
  }

  confirmDeletion(): void {
    const tdr = this.tdr();

    if (!tdr) {
      return;
    }

    this.runAction(
      this.tdrService.delete(tdr.id),
      this.deleting,
      () => {
        this.store.tdr.set(null);
        this.confirmingDeletion.set(false);
        this.toastService.success('Les termes de référence ont été supprimés.');
      },
      () => this.confirmingDeletion.set(false)
    );
  }

  private toDraft(tdr: Tdr): TdrDraft {
    return {
      dateTdr: tdr.dateTdr ?? '',
      contexte: tdr.contexte ?? '',
      competence: tdr.competence ?? '',
      perimetre: tdr.perimetre ?? '',
      periodeObservation: tdr.periodeObservation ?? '',
      lieu: tdr.lieu ?? '',
      methodologieTravail: tdr.methodologieTravail ?? '',
      resultatsAttendus: tdr.resultatsAttendus ?? '',
      livrables: tdr.livrables ?? ''
    };
  }
}
