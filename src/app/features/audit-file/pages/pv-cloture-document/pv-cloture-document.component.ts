import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { injectActionRunner } from '../../../../core/http/action-runner';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DocumentToolbarComponent } from '../../../../shared/components/document-toolbar/document-toolbar.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { TextareaFieldComponent } from '../../../../shared/components/textarea-field/textarea-field.component';
import { ReunionAttendeesComponent } from '../../components/reunion-attendees/reunion-attendees.component';
import { ReunionSheetComponent } from '../../components/reunion-sheet/reunion-sheet.component';
import { TEST_RESULT_LABELS, TestResult } from '../../models/audit-test.model';
import { ClosingReunionRequest, ParticipantType, Reunion, participantIds, toParticipantRequests } from '../../models/reunion.model';
import { AuditFileStore, uniquePersons } from '../../services/audit-file.store';
import { ReunionService } from '../../services/reunion.service';

type PvTextField =
  | 'dateReunion'
  | 'heureDebut'
  | 'heureFin'
  | 'heureLevee'
  | 'lieu'
  | 'remerciements'
  | 'rappelPerimetre'
  | 'syntheseConstats'
  | 'pointsFortsIdentifies'
  | 'resumeResultatsVerification'
  | 'resumeRecommandationsPlansActions'
  | 'observationsCommentaires';

type PvDraft = Record<PvTextField, string>;

@Component({
  selector: 'app-pv-cloture-document',
  standalone: true,
  imports: [
    ButtonComponent,
    DocumentToolbarComponent,
    EmptyStateComponent,
    FormFieldComponent,
    ModalComponent,
    ReunionAttendeesComponent,
    ReunionSheetComponent,
    TextareaFieldComponent
  ],
  templateUrl: './pv-cloture-document.component.html',
  styleUrl: './pv-cloture-document.component.scss'
})
export class PvClotureDocumentComponent {
  private readonly reunionService = inject(ReunionService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly runAction = injectActionRunner();
  readonly store = inject(AuditFileStore);

  readonly mission = this.store.mission;
  readonly reunion = this.store.closingReunion;

  readonly editing = signal<boolean>(false);
  readonly draft = signal<PvDraft>(this.emptyDraft());
  readonly selectedEntite = signal<Set<number>>(new Set());
  readonly selectedDai = signal<Set<number>>(new Set());
  readonly showErrors = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly confirmingDeletion = signal<boolean>(false);
  readonly deleting = signal<boolean>(false);

  // One line per person, even when a person has several roles in the mission.
  readonly entiteMembers = computed(() => uniquePersons(this.store.pointsFocaux()));
  readonly daiMembers = computed(() => uniquePersons(this.store.auditors()));

  readonly dateError = computed(() =>
    this.showErrors() && !this.draft().dateReunion ? 'La date de la réunion est obligatoire.' : null
  );
  readonly heureFinError = computed(() => {
    const { heureDebut, heureFin } = this.draft();
    return this.showErrors() && heureDebut && heureFin && heureFin < heureDebut
      ? 'La fin de séance doit être après le début.'
      : null;
  });

  startEditing(): void {
    const reunion = this.reunion();

    this.draft.set(reunion ? this.toDraft(reunion) : this.emptyDraft());
    this.selectedEntite.set(
      new Set(reunion ? participantIds(reunion, 'ENTITE_AUDITEE') : this.entiteMembers().map((member) => member.personneId))
    );
    this.selectedDai.set(
      new Set(reunion ? participantIds(reunion, 'EQUIPE_DAI') : this.daiMembers().map((member) => member.personneId))
    );
    this.showErrors.set(false);
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
  }

  updateField(field: PvTextField, value: string): void {
    this.draft.update((draft) => ({ ...draft, [field]: value }));
  }

  toggleParticipant(type: ParticipantType, personneId: number, checked: boolean): void {
    const selection = type === 'ENTITE_AUDITEE' ? this.selectedEntite : this.selectedDai;

    selection.update((ids) => {
      const next = new Set(ids);

      if (checked) {
        next.add(personneId);
      } else {
        next.delete(personneId);
      }

      return next;
    });
  }

  save(): void {
    const mission = this.mission();
    this.showErrors.set(true);

    if (!mission || this.dateError() || this.heureFinError()) {
      return;
    }

    const draft = this.draft();
    const text = (value: string): string | null => value.trim() || null;
    const request: ClosingReunionRequest = {
      missionId: mission.id,
      type: 'CLOTURE',
      dateReunion: draft.dateReunion,
      heureDebut: draft.heureDebut || null,
      heureFin: draft.heureFin || null,
      heureLevee: draft.heureLevee || null,
      lieu: text(draft.lieu),
      remerciements: text(draft.remerciements),
      rappelPerimetre: text(draft.rappelPerimetre),
      syntheseConstats: text(draft.syntheseConstats),
      pointsFortsIdentifies: text(draft.pointsFortsIdentifies),
      resumeResultatsVerification: text(draft.resumeResultatsVerification),
      resumeRecommandationsPlansActions: text(draft.resumeRecommandationsPlansActions),
      observationsCommentaires: text(draft.observationsCommentaires),
      participants: [
        ...toParticipantRequests(this.entiteMembers(), this.selectedEntite(), 'ENTITE_AUDITEE'),
        ...toParticipantRequests(this.daiMembers(), this.selectedDai(), 'EQUIPE_DAI')
      ]
    };

    const existing = this.reunion();
    const save$ = existing ? this.reunionService.update(existing.id, request) : this.reunionService.create(request);

    this.runAction(save$, this.saving, (reunion) => {
      this.store.closingReunion.set(reunion);
      this.editing.set(false);
      this.toastService.success(existing ? 'Le PV de clôture a été modifié.' : 'Le PV de clôture a été créé.');
    });
  }

  confirmDeletion(): void {
    const reunion = this.reunion();

    if (!reunion) {
      return;
    }

    this.runAction(
      this.reunionService.delete(reunion.id),
      this.deleting,
      () => {
        this.store.closingReunion.set(null);
        this.confirmingDeletion.set(false);
        this.toastService.success('Le PV de clôture a été supprimé.');
      },
      () => this.confirmingDeletion.set(false)
    );
  }

  editMission(): void {
    const mission = this.mission();

    if (mission) {
      this.router.navigate(['/missions', mission.id]);
    }
  }

  private toDraft(reunion: Reunion): PvDraft {
    return {
      dateReunion: reunion.dateReunion ?? '',
      heureDebut: reunion.heureDebut?.slice(0, 5) ?? '',
      heureFin: reunion.heureFin?.slice(0, 5) ?? '',
      heureLevee: reunion.heureLevee?.slice(0, 5) ?? '',
      lieu: reunion.lieu ?? '',
      remerciements: reunion.remerciements ?? '',
      rappelPerimetre: reunion.rappelPerimetre ?? '',
      syntheseConstats: reunion.syntheseConstats ?? '',
      pointsFortsIdentifies: reunion.pointsFortsIdentifies ?? '',
      resumeResultatsVerification: reunion.resumeResultatsVerification ?? '',
      resumeRecommandationsPlansActions: reunion.resumeRecommandationsPlansActions ?? '',
      observationsCommentaires: reunion.observationsCommentaires ?? ''
    };
  }

  // Starting text of a new PV, drawn from the audit file: scope of the TDR, constats, tests and retained recommendations.
  private emptyDraft(): PvDraft {
    const constats = this.store.constats();
    const structure = this.mission()?.structureNom ?? "l'entité auditée";

    return {
      dateReunion: '',
      heureDebut: '',
      heureFin: '',
      heureLevee: '',
      lieu: '',
      remerciements: `Remerciements à ${structure} pour sa disponibilité et sa collaboration tout au long de la mission.`,
      rappelPerimetre: this.store.tdr()?.perimetre ?? '',
      syntheseConstats: constats.map((constat) => `${constat.reference} : ${constat.descriptions}`).join('\n'),
      pointsFortsIdentifies: '',
      resumeResultatsVerification: this.summarizeTests(),
      resumeRecommandationsPlansActions: constats
        .flatMap((constat) =>
          constat.recommandations
            .filter((recommandation) => recommandation.retenue)
            .map((recommandation) => `${constat.reference} : ${recommandation.description}`)
        )
        .join('\n'),
      observationsCommentaires: ''
    };
  }

  // "3 test(s) réalisé(s) : 1 effectif, 2 ineffectif."
  private summarizeTests(): string {
    const tests = this.store.tests();

    if (tests.length === 0) {
      return '';
    }

    const counts = (Object.keys(TEST_RESULT_LABELS) as TestResult[])
      .map((result) => ({ result, count: tests.filter((test) => test.resultatTest === result).length }))
      .filter(({ count }) => count > 0)
      .map(({ result, count }) => `${count} ${TEST_RESULT_LABELS[result].toLowerCase()}`);

    return `${tests.length} test(s) réalisé(s)${counts.length > 0 ? ' : ' + counts.join(', ') : ''}.`;
  }
}
