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
import { OpeningReunionRequest, ParticipantType, Reunion, participantIds, toParticipantRequests } from '../../models/reunion.model';
import { AuditFileStore, uniquePersons } from '../../services/audit-file.store';
import { ReunionService } from '../../services/reunion.service';

type PvTextField =
  | 'dateReunion'
  | 'heureDebut'
  | 'heureFin'
  | 'heureLevee'
  | 'lieu'
  | 'observations'
  | 'pointsDaiIntroduction'
  | 'pointsDaiPresentationMission'
  | 'pointsDaiMethodologie'
  | 'pointsInterlocuteursIntroduction'
  | 'pointsInterlocuteursProcessus'
  | 'pointsInterlocuteursOrganisation';

type PvDraft = Record<PvTextField, string>;

@Component({
  selector: 'app-pv-ouverture-document',
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
  templateUrl: './pv-ouverture-document.component.html',
  styleUrl: './pv-ouverture-document.component.scss'
})
export class PvOuvertureDocumentComponent {
  private readonly reunionService = inject(ReunionService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly runAction = injectActionRunner();
  readonly store = inject(AuditFileStore);

  readonly mission = this.store.mission;
  readonly reunion = this.store.openingReunion;

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
    const request: OpeningReunionRequest = {
      missionId: mission.id,
      type: 'OUVERTURE',
      dateReunion: draft.dateReunion,
      heureDebut: draft.heureDebut || null,
      heureFin: draft.heureFin || null,
      heureLevee: draft.heureLevee || null,
      lieu: text(draft.lieu),
      observations: text(draft.observations),
      pointsDaiIntroduction: text(draft.pointsDaiIntroduction),
      pointsDaiPresentationMission: text(draft.pointsDaiPresentationMission),
      pointsDaiMethodologie: text(draft.pointsDaiMethodologie),
      pointsInterlocuteursIntroduction: text(draft.pointsInterlocuteursIntroduction),
      pointsInterlocuteursProcessus: text(draft.pointsInterlocuteursProcessus),
      pointsInterlocuteursOrganisation: text(draft.pointsInterlocuteursOrganisation),
      participants: [
        ...toParticipantRequests(this.entiteMembers(), this.selectedEntite(), 'ENTITE_AUDITEE'),
        ...toParticipantRequests(this.daiMembers(), this.selectedDai(), 'EQUIPE_DAI')
      ]
    };

    const existing = this.reunion();
    const save$ = existing ? this.reunionService.update(existing.id, request) : this.reunionService.create(request);

    this.runAction(save$, this.saving, (reunion) => {
      this.store.openingReunion.set(reunion);
      this.editing.set(false);
      this.toastService.success(existing ? "Le PV d'ouverture a été modifié." : "Le PV d'ouverture a été créé.");
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
        this.store.openingReunion.set(null);
        this.confirmingDeletion.set(false);
        this.toastService.success("Le PV d'ouverture a été supprimé.");
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
      observations: reunion.observations ?? '',
      pointsDaiIntroduction: reunion.pointsDaiIntroduction ?? '',
      pointsDaiPresentationMission: reunion.pointsDaiPresentationMission ?? '',
      pointsDaiMethodologie: reunion.pointsDaiMethodologie ?? '',
      pointsInterlocuteursIntroduction: reunion.pointsInterlocuteursIntroduction ?? '',
      pointsInterlocuteursProcessus: reunion.pointsInterlocuteursProcessus ?? '',
      pointsInterlocuteursOrganisation: reunion.pointsInterlocuteursOrganisation ?? ''
    };
  }

  // Starting text of a new PV: the points listed in Document.docx.
  private emptyDraft(): PvDraft {
    const numero = this.mission()?.numero ?? '……';

    return {
      dateReunion: '',
      heureDebut: '',
      heureFin: '',
      heureLevee: '',
      lieu: '',
      observations: '',
      pointsDaiIntroduction:
        'Remerciements.\n' +
        "Présentation de l'équipe de la DAI en charge de la mission.\n" +
        `Présentation de l'Ordre de mission n° ${numero}.`,
      pointsDaiPresentationMission:
        'Contexte et objectifs de la mission.\nRappel général sur la mission de la DAI.\nPérimètre de l\'audit.',
      pointsDaiMethodologie:
        'Demande de collaboration ainsi que de la disponibilité des équipes.\n' +
        'Demande des documents nécessaires à la mission.\n' +
        'Phases de la mission.\n' +
        'Planning prévisionnel des travaux.\n' +
        'Désignation des points focaux (interlocuteurs désignés).',
      pointsInterlocuteursIntroduction:
        "Présentation de tous les acteurs.\nExplication succincte sur l'organisation et le mode de gestion.",
      pointsInterlocuteursProcessus: 'Présentation du processus interne / bref historique.',
      pointsInterlocuteursOrganisation:
        'Organisation interne.\n' +
        'Documents de base (manuel de procédures).\n' +
        'Présentation des textes et des lois réglementaires exploités par les acteurs.'
    };
  }
}
