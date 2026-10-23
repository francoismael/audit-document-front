import { DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

import { injectActionRunner } from '../../../../core/http/action-runner';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CheckboxFieldComponent } from '../../../../shared/components/checkbox-field/checkbox-field.component';
import { DocumentSheetComponent } from '../../../../shared/components/document-sheet/document-sheet.component';
import { DocumentToolbarComponent } from '../../../../shared/components/document-toolbar/document-toolbar.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { TextareaFieldComponent } from '../../../../shared/components/textarea-field/textarea-field.component';
import { MISSION_ROLE_LABELS } from '../../../missions/models/mission-labels';
import { MissionPersonne } from '../../../missions/models/mission-personne.model';
import { OpeningReunionRequest, ParticipantType, Reunion, ReunionParticipant } from '../../models/reunion.model';
import { AuditFileStore } from '../../services/audit-file.store';
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
    CheckboxFieldComponent,
    DatePipe,
    DocumentSheetComponent,
    DocumentToolbarComponent,
    EmptyStateComponent,
    FormFieldComponent,
    ModalComponent,
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
  readonly roleLabels = MISSION_ROLE_LABELS;

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

  readonly entiteParticipants = computed(() => this.participantsOfType('ENTITE_AUDITEE'));
  readonly daiParticipants = computed(() => this.participantsOfType('EQUIPE_DAI'));

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
      new Set(reunion ? this.idsOfType(reunion, 'ENTITE_AUDITEE') : this.entiteMembers().map((member) => member.personneId))
    );
    this.selectedDai.set(
      new Set(reunion ? this.idsOfType(reunion, 'EQUIPE_DAI') : this.daiMembers().map((member) => member.personneId))
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
        ...this.entiteMembers()
          .filter((member) => this.selectedEntite().has(member.personneId))
          .map((member) => ({ personneId: member.personneId, role: member.roles, typeParticipant: 'ENTITE_AUDITEE' as const })),
        ...this.daiMembers()
          .filter((member) => this.selectedDai().has(member.personneId))
          .map((member) => ({ personneId: member.personneId, role: member.roles, typeParticipant: 'EQUIPE_DAI' as const }))
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

  // "09:30:00" → "09h30".
  formatTime(time: string | null): string {
    return time ? time.slice(0, 5).replace(':', 'h') : '……';
  }

  describe(participant: ReunionParticipant): string {
    const name = `${participant.nom} ${participant.prenom}`;
    return participant.fonction ? `${name}, ${participant.fonction}` : name;
  }

  private participantsOfType(type: ParticipantType): ReunionParticipant[] {
    return (this.reunion()?.participants ?? []).filter((participant) => participant.typeParticipant === type);
  }

  private idsOfType(reunion: Reunion, type: ParticipantType): number[] {
    return reunion.participants
      .filter((participant) => participant.typeParticipant === type)
      .map((participant) => participant.personneId);
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

function uniquePersons(members: MissionPersonne[]): MissionPersonne[] {
  const seen = new Set<number>();

  return members.filter((member) => {
    if (seen.has(member.personneId)) {
      return false;
    }

    seen.add(member.personneId);
    return true;
  });
}
