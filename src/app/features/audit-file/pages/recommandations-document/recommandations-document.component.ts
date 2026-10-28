import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { Observable, concat, last, switchMap } from 'rxjs';

import { injectActionRunner } from '../../../../core/http/action-runner';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DocumentSheetComponent } from '../../../../shared/components/document-sheet/document-sheet.component';
import { DocumentToolbarComponent } from '../../../../shared/components/document-toolbar/document-toolbar.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { SelectFieldComponent } from '../../../../shared/components/select-field/select-field.component';
import { SelectFieldOption } from '../../../../shared/components/select-field/select-field.interface';
import { TextareaFieldComponent } from '../../../../shared/components/textarea-field/textarea-field.component';
import { todayAsText } from '../../../missions/models/mission-labels';
import { RecommandationLigne, TableauRecommandations } from '../../models/tableau-recommandations.model';
import { AuditFileStore } from '../../services/audit-file.store';
import { TableauRecommandationsService } from '../../services/tableau-recommandations.service';

type MaintienChoice = '' | 'oui' | 'non';

interface LigneDraft {
  ligne: RecommandationLigne;
  reponse: string;
  dateReponse: string;
  maintien: MaintienChoice;
}

@Component({
  selector: 'app-recommandations-document',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    DocumentSheetComponent,
    DocumentToolbarComponent,
    FormFieldComponent,
    SelectFieldComponent,
    TextareaFieldComponent
  ],
  templateUrl: './recommandations-document.component.html',
  styleUrl: './recommandations-document.component.scss'
})
export class RecommandationsDocumentComponent {
  private readonly tableauService = inject(TableauRecommandationsService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly runAction = injectActionRunner();
  readonly store = inject(AuditFileStore);

  readonly mission = this.store.mission;
  readonly tableau = this.store.tableauRecommandations;
  readonly lignes = computed(() => this.tableau()?.lignes ?? []);
  readonly decidedCount = computed(() => this.lignes().filter((ligne) => ligne.recommandationMaintenue !== null).length);

  readonly maintienOptions: SelectFieldOption[] = [
    { value: 'oui', label: 'Oui, maintenue' },
    { value: 'non', label: 'Non, levée' }
  ];

  readonly editing = signal<boolean>(false);
  readonly drafts = signal<LigneDraft[]>([]);
  readonly showErrors = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly refreshing = signal<boolean>(false);

  // The decision on the maintenance comes after the response of the entity (backend rule).
  readonly invalidLines = computed(() =>
    this.drafts()
      .filter((draft) => draft.maintien !== '' && !draft.reponse.trim())
      .map((draft) => draft.ligne.recommandationId)
  );

  constructor() {
    // The constats may have changed since the workspace was opened.
    this.refresh();
  }

  startEditing(): void {
    this.drafts.set(
      this.lignes().map((ligne) => ({
        ligne,
        reponse: ligne.reponse ?? '',
        dateReponse: ligne.dateReponse ?? todayAsText(),
        maintien: ligne.recommandationMaintenue === null ? '' : ligne.recommandationMaintenue ? 'oui' : 'non'
      }))
    );
    this.showErrors.set(false);
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
  }

  updateDraft(index: number, changes: Partial<LigneDraft>): void {
    this.drafts.update((drafts) => drafts.map((draft, position) => (position === index ? { ...draft, ...changes } : draft)));
  }

  // Without a response there is nothing to decide on.
  updateReponse(index: number, reponse: string): void {
    this.updateDraft(index, reponse.trim() ? { reponse } : { reponse, maintien: '' });
  }

  updateMaintien(index: number, value: string): void {
    this.updateDraft(index, { maintien: value === 'oui' || value === 'non' ? value : '' });
  }

  save(): void {
    const mission = this.mission();
    this.showErrors.set(true);

    if (!mission || this.invalidLines().length > 0) {
      return;
    }

    const changes = this.drafts()
      .map((draft) => this.saveLigne(draft))
      .filter((change): change is Observable<unknown> => change !== null);

    if (changes.length === 0) {
      this.editing.set(false);
      return;
    }

    // One line after the other, then the table is read again: it gives the last response of each recommendation.
    const save$ = concat(...changes).pipe(
      last(),
      switchMap(() => this.tableauService.getByMission(mission.id))
    );

    this.runAction(
      save$,
      this.saving,
      (tableau) => {
        this.store.tableauRecommandations.set(tableau);
        this.editing.set(false);
        this.toastService.success('Le tableau des recommandations est enregistré.');
      },
      () => this.refresh()
    );
  }

  openConstats(): void {
    const mission = this.mission();

    if (mission) {
      this.router.navigate(['/missions', mission.id, 'dossier', 'constats']);
    }
  }

  maintienLabel(ligne: RecommandationLigne): string {
    return ligne.recommandationMaintenue === null ? '' : ligne.recommandationMaintenue ? 'Oui' : 'Non';
  }

  private refresh(): void {
    const mission = this.mission();

    if (mission) {
      this.runAction(this.tableauService.getByMission(mission.id), this.refreshing, (tableau: TableauRecommandations) =>
        this.store.tableauRecommandations.set(tableau)
      );
    }
  }

  // The calls needed for one line, or null when nothing changed.
  private saveLigne(draft: LigneDraft): Observable<unknown> | null {
    const { ligne } = draft;
    const reponse = draft.reponse.trim();
    const request = { recommandationId: ligne.recommandationId, descriptions: reponse, dateReponse: draft.dateReponse || null };
    const maintenue = draft.maintien === '' ? null : draft.maintien === 'oui';

    // An emptied response is deleted; the backend then clears the decision.
    if (!reponse) {
      return ligne.reponseId !== null ? this.tableauService.deleteReponse(ligne.reponseId) : null;
    }

    const reponseChanged = reponse !== ligne.reponse || request.dateReponse !== ligne.dateReponse;
    const reponse$: Observable<unknown> | null = !reponseChanged
      ? null
      : ligne.reponseId !== null
        ? this.tableauService.updateReponse(ligne.reponseId, request)
        : this.tableauService.createReponse(request);
    const decision$ =
      maintenue !== null && maintenue !== ligne.recommandationMaintenue
        ? this.tableauService.decideMaintien(ligne.recommandationId, maintenue)
        : null;

    if (reponse$ && decision$) {
      return concat(reponse$, decision$);
    }

    return reponse$ ?? decision$ ?? null;
  }
}
