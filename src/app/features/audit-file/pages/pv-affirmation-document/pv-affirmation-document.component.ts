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
import { MISSION_ROLE_LABELS, todayAsText } from '../../../missions/models/mission-labels';
import { Constat } from '../../models/constat.model';
import {
  AffirmationParticipantType,
  PvAffirmation,
  PvAffirmationParticipant,
  PvAffirmationRequest
} from '../../models/pv-affirmation.model';
import { AuditFileStore, uniquePersons } from '../../services/audit-file.store';
import { PvAffirmationService } from '../../services/pv-affirmation.service';

interface PvDraft {
  dateEntretien: string;
  lieu: string;
  observationsComplementaires: string;
}

// One line per constat of the mission; only the included ones are sent.
interface LigneDraft {
  constat: Constat;
  included: boolean;
  question: string;
  reponseEntite: string;
  piecesJustificatives: string;
  commentairesAuditeurs: string;
}

@Component({
  selector: 'app-pv-affirmation-document',
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
  templateUrl: './pv-affirmation-document.component.html',
  styleUrl: './pv-affirmation-document.component.scss'
})
export class PvAffirmationDocumentComponent {
  private readonly pvService = inject(PvAffirmationService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly runAction = injectActionRunner();
  readonly store = inject(AuditFileStore);

  readonly mission = this.store.mission;
  readonly pv = this.store.pvAffirmation;
  readonly roleLabels = MISSION_ROLE_LABELS;

  readonly editing = signal<boolean>(false);
  readonly draft = signal<PvDraft>({ dateEntretien: '', lieu: '', observationsComplementaires: '' });
  // Selected attendees, by missionPersonneId.
  readonly selectedAuditeurs = signal<Set<number>>(new Set());
  readonly selectedEntite = signal<Set<number>>(new Set());
  readonly lignes = signal<LigneDraft[]>([]);
  readonly showErrors = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly confirmingDeletion = signal<boolean>(false);
  readonly deleting = signal<boolean>(false);

  // One line per person: their first membership in the mission is the one sent.
  readonly auditeurs = this.store.declarants;
  readonly entite = computed(() => uniquePersons(this.store.pointsFocaux()));

  readonly auditeurParticipants = computed(() => this.participantsOfType('AUDITEUR'));
  readonly entiteParticipants = computed(() => this.participantsOfType('ENTITE_AUDITEE'));

  readonly dateError = computed(() =>
    this.showErrors() && !this.draft().dateEntretien ? 'La date de l\'entretien est obligatoire.' : null
  );
  readonly participantsError = computed(() =>
    this.showErrors() && this.selectedAuditeurs().size + this.selectedEntite().size === 0 ? 'Cochez au moins un participant.' : null
  );
  readonly lignesError = computed(() => {
    if (!this.showErrors()) {
      return null;
    }

    const included = this.lignes().filter((ligne) => ligne.included);

    if (included.length === 0) {
      return 'Retenez au moins un constat.';
    }

    return included.some((ligne) => !ligne.question.trim()) ? 'Chaque constat retenu doit avoir sa question.' : null;
  });

  // "du 02/11/2026 au 27/11/2026", for the introductory sentence.
  readonly missionPeriod = computed(() => {
    const mission = this.mission();
    const format = (date: string | null): string => (date ? date.split('-').reverse().join('/') : '……');
    return mission ? `du ${format(mission.dateDebut)} au ${format(mission.dateFin)}` : '';
  });

  startEditing(): void {
    const pv = this.pv();

    this.draft.set({
      dateEntretien: pv?.dateEntretien ?? todayAsText(),
      lieu: pv?.lieu ?? '',
      observationsComplementaires: pv?.observationsComplementaires ?? ''
    });
    this.selectedAuditeurs.set(
      new Set(pv ? this.idsOfType(pv, 'AUDITEUR') : this.auditeurs().map((member) => member.missionPersonneId))
    );
    this.selectedEntite.set(
      new Set(pv ? this.idsOfType(pv, 'ENTITE_AUDITEE') : this.entite().map((member) => member.missionPersonneId))
    );
    this.lignes.set(
      this.store.constats().map((constat) => {
        const existing = pv?.lignes.find((ligne) => ligne.constatId === constat.id);
        return {
          constat,
          included: pv ? !!existing : true,
          question: existing?.question ?? constat.descriptions,
          reponseEntite: existing?.reponseEntite ?? '',
          piecesJustificatives: existing?.piecesJustificatives ?? '',
          commentairesAuditeurs: existing?.commentairesAuditeurs ?? ''
        };
      })
    );
    this.showErrors.set(false);
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
  }

  updateField(field: keyof PvDraft, value: string): void {
    this.draft.update((draft) => ({ ...draft, [field]: value }));
  }

  toggleParticipant(type: AffirmationParticipantType, missionPersonneId: number, checked: boolean): void {
    const selection = type === 'AUDITEUR' ? this.selectedAuditeurs : this.selectedEntite;

    selection.update((ids) => {
      const next = new Set(ids);

      if (checked) {
        next.add(missionPersonneId);
      } else {
        next.delete(missionPersonneId);
      }

      return next;
    });
  }

  updateLigne(index: number, changes: Partial<LigneDraft>): void {
    this.lignes.update((lignes) => lignes.map((ligne, position) => (position === index ? { ...ligne, ...changes } : ligne)));
  }

  save(): void {
    const mission = this.mission();
    this.showErrors.set(true);

    if (!mission || this.dateError() || this.participantsError() || this.lignesError()) {
      return;
    }

    const draft = this.draft();
    const text = (value: string): string | null => value.trim() || null;
    const request: PvAffirmationRequest = {
      missionId: mission.id,
      dateEntretien: draft.dateEntretien,
      lieu: text(draft.lieu),
      observationsComplementaires: text(draft.observationsComplementaires),
      participants: [
        ...[...this.selectedAuditeurs()].map((id) => ({ missionPersonneId: id, typeParticipant: 'AUDITEUR' as const })),
        ...[...this.selectedEntite()].map((id) => ({ missionPersonneId: id, typeParticipant: 'ENTITE_AUDITEE' as const }))
      ],
      lignes: this.lignes()
        .filter((ligne) => ligne.included)
        .map((ligne) => ({
          constatId: ligne.constat.id,
          question: ligne.question.trim(),
          reponseEntite: text(ligne.reponseEntite),
          piecesJustificatives: text(ligne.piecesJustificatives),
          commentairesAuditeurs: text(ligne.commentairesAuditeurs)
        }))
    };

    const existing = this.pv();
    const save$ = existing ? this.pvService.update(existing.id, request) : this.pvService.create(request);

    this.runAction(save$, this.saving, (pv) => {
      this.store.pvAffirmation.set(pv);
      this.editing.set(false);
      this.toastService.success("Le PV d'affirmation des constats est enregistré.");
    });
  }

  confirmDeletion(): void {
    const pv = this.pv();

    if (!pv) {
      return;
    }

    this.runAction(
      this.pvService.delete(pv.id),
      this.deleting,
      () => {
        this.store.pvAffirmation.set(null);
        this.confirmingDeletion.set(false);
        this.toastService.success("Le PV d'affirmation a été supprimé.");
      },
      () => this.confirmingDeletion.set(false)
    );
  }

  openPage(slug: string): void {
    const mission = this.mission();

    if (mission) {
      this.router.navigate(['/missions', mission.id, 'dossier', slug]);
    }
  }

  editMission(): void {
    const mission = this.mission();

    if (mission) {
      this.router.navigate(['/missions', mission.id]);
    }
  }

  describe(participant: PvAffirmationParticipant): string {
    const name = `${participant.nom} ${participant.prenom}`;
    return participant.fonction ? `${name}, ${participant.fonction}` : name;
  }

  private participantsOfType(type: AffirmationParticipantType): PvAffirmationParticipant[] {
    return (this.pv()?.participants ?? []).filter((participant) => participant.typeParticipant === type);
  }

  private idsOfType(pv: PvAffirmation, type: AffirmationParticipantType): number[] {
    return pv.participants
      .filter((participant) => participant.typeParticipant === type)
      .map((participant) => participant.missionPersonneId);
  }
}
