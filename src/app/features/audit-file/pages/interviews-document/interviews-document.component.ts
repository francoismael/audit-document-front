import { DatePipe } from '@angular/common';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';

import { injectActionRunner } from '../../../../core/http/action-runner';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DocumentSheetComponent } from '../../../../shared/components/document-sheet/document-sheet.component';
import { DocumentToolbarComponent } from '../../../../shared/components/document-toolbar/document-toolbar.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SelectFieldComponent } from '../../../../shared/components/select-field/select-field.component';
import { SelectFieldOption } from '../../../../shared/components/select-field/select-field.interface';
import { TextareaFieldComponent } from '../../../../shared/components/textarea-field/textarea-field.component';
import { MISSION_ROLE_LABELS, todayAsText } from '../../../missions/models/mission-labels';
import { MissionPersonne } from '../../../missions/models/mission-personne.model';
import { DocumentListItemComponent } from '../../components/document-list-item/document-list-item.component';
import { DocumentSplitComponent } from '../../components/document-split/document-split.component';
import { Interview, InterviewQuestionRequest, InterviewRequest } from '../../models/interview.model';
import { AuditFileStore } from '../../services/audit-file.store';
import { InterviewService } from '../../services/interview.service';

interface InterviewDraft {
  personneIntervieweeId: string;
  dateInterview: string;
  fonction: string;
  anciennete: string;
  redigeParPersonneId: string;
  superviseParPersonneId: string;
  valideParPersonneId: string;
  dateRedaction: string;
  dateSupervision: string;
  dateValidation: string;
}

type InterviewTextField = keyof InterviewDraft;

@Component({
  selector: 'app-interviews-document',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    DocumentListItemComponent,
    DocumentSheetComponent,
    DocumentSplitComponent,
    DocumentToolbarComponent,
    EmptyStateComponent,
    FormFieldComponent,
    IconButtonComponent,
    ModalComponent,
    SelectFieldComponent,
    TextareaFieldComponent
  ],
  templateUrl: './interviews-document.component.html',
  styleUrl: './interviews-document.component.scss'
})
export class InterviewsDocumentComponent {
  private readonly interviewService = inject(InterviewService);
  private readonly toastService = inject(ToastService);
  private readonly runAction = injectActionRunner();
  readonly store = inject(AuditFileStore);

  readonly mission = this.store.mission;
  readonly interviews = this.store.interviews;

  // The interview shown on the right; the first one by default.
  readonly selectedId = linkedSignal<number | null>(() => this.interviews()[0]?.id ?? null);
  readonly selected = computed(() => this.interviews().find((interview) => interview.id === this.selectedId()) ?? null);

  // Null: reading; 'new': writing a new interview; an interview: editing it.
  readonly editing = signal<Interview | 'new' | null>(null);
  readonly draft = signal<InterviewDraft>(emptyDraft());
  readonly questions = signal<InterviewQuestionRequest[]>([]);
  readonly showErrors = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly interviewToDelete = signal<Interview | null>(null);
  readonly deleting = signal<boolean>(false);

  // The interviewee is usually a point focal of the audited entity: they come first.
  readonly intervieweeOptions = computed<SelectFieldOption[]>(() =>
    [...this.store.pointsFocaux(), ...this.store.people().filter((member) => member.roles !== 'POINT_FOCAL')]
      .filter((member, index, members) => members.findIndex((other) => other.personneId === member.personneId) === index)
      .map((member) => this.toOption(member))
  );
  readonly visaOptions = computed<SelectFieldOption[]>(() => this.store.declarants().map((member) => this.toOption(member)));

  readonly intervieweeError = computed(() =>
    this.showErrors() && !this.draft().personneIntervieweeId ? 'Choisissez la personne interviewée.' : null
  );
  readonly questionsError = computed(() =>
    this.showErrors() && this.questions().some((question) => !question.question.trim())
      ? 'Chaque question doit avoir un texte (ou retirez-la).'
      : null
  );

  readonly toolbarTitle = computed(() => {
    const editing = this.editing();
    return editing === 'new' ? 'Nouvelle fiche d\'interview' : editing ? `Modifier la fiche ${editing.reference}` : "Fiches d'interview";
  });

  select(interview: Interview): void {
    this.selectedId.set(interview.id);
  }

  startCreating(): void {
    this.draft.set({ ...emptyDraft(), dateInterview: todayAsText(), dateRedaction: todayAsText() });
    this.questions.set([{ question: '', reponse: '' }]);
    this.showErrors.set(false);
    this.editing.set('new');
  }

  startEditing(interview: Interview): void {
    this.draft.set({
      personneIntervieweeId: String(interview.personneIntervieweeId),
      dateInterview: interview.dateInterview ?? '',
      fonction: interview.fonction ?? '',
      anciennete: interview.anciennete ?? '',
      redigeParPersonneId: idText(interview.redigeParPersonneId),
      superviseParPersonneId: idText(interview.superviseParPersonneId),
      valideParPersonneId: idText(interview.valideParPersonneId),
      dateRedaction: interview.dateRedaction ?? '',
      dateSupervision: interview.dateSupervision ?? '',
      dateValidation: interview.dateValidation ?? ''
    });
    this.questions.set(interview.questions.map((question) => ({ question: question.question, reponse: question.reponse ?? '' })));
    this.showErrors.set(false);
    this.editing.set(interview);
  }

  cancelEditing(): void {
    this.editing.set(null);
  }

  updateField(field: InterviewTextField, value: string): void {
    this.draft.update((draft) => ({ ...draft, [field]: value }));
  }

  // Choosing the interviewee fills in their function when it is still empty.
  chooseInterviewee(personneId: string): void {
    const member = this.store.people().find((person) => String(person.personneId) === personneId);

    this.draft.update((draft) => ({
      ...draft,
      personneIntervieweeId: personneId,
      fonction: draft.fonction || member?.fonction || ''
    }));
  }

  addQuestion(): void {
    this.questions.update((questions) => [...questions, { question: '', reponse: '' }]);
  }

  updateQuestion(index: number, field: keyof InterviewQuestionRequest, value: string): void {
    this.questions.update((questions) =>
      questions.map((question, position) => (position === index ? { ...question, [field]: value } : question))
    );
  }

  removeQuestion(index: number): void {
    this.questions.update((questions) => questions.filter((_, position) => position !== index));
  }

  save(): void {
    const mission = this.mission();
    const editing = this.editing();
    this.showErrors.set(true);

    if (!mission || !editing || this.intervieweeError() || this.questionsError()) {
      return;
    }

    const draft = this.draft();
    const request: InterviewRequest = {
      missionId: mission.id,
      personneIntervieweeId: Number(draft.personneIntervieweeId),
      dateInterview: draft.dateInterview || null,
      fonction: draft.fonction.trim() || null,
      anciennete: draft.anciennete.trim() || null,
      redigeParPersonneId: idOrNull(draft.redigeParPersonneId),
      superviseParPersonneId: idOrNull(draft.superviseParPersonneId),
      valideParPersonneId: idOrNull(draft.valideParPersonneId),
      dateRedaction: draft.dateRedaction || null,
      dateSupervision: draft.dateSupervision || null,
      dateValidation: draft.dateValidation || null,
      questions: this.questions().map((question) => ({
        question: question.question.trim(),
        reponse: question.reponse?.trim() || null
      }))
    };

    const save$ = editing === 'new' ? this.interviewService.create(request) : this.interviewService.update(editing.id, request);

    this.runAction(save$, this.saving, (saved) => {
      this.interviews.update((interviews) => [...interviews.filter((interview) => interview.id !== saved.id), saved]);
      this.selectedId.set(saved.id);
      this.editing.set(null);
      this.toastService.success(`La fiche d'interview ${saved.reference} est enregistrée.`);
    });
  }

  confirmDeletion(): void {
    const interview = this.interviewToDelete();

    if (!interview) {
      return;
    }

    this.runAction(
      this.interviewService.delete(interview.id),
      this.deleting,
      () => {
        this.interviews.update((interviews) => interviews.filter((item) => item.id !== interview.id));
        this.interviewToDelete.set(null);
        this.toastService.success(`La fiche d'interview ${interview.reference} a été supprimée.`);
      },
      () => this.interviewToDelete.set(null)
    );
  }

  personName(nom: string | null, prenom: string | null): string {
    return nom ? `${nom} ${prenom ?? ''}`.trim() : '……………';
  }

  private toOption(member: MissionPersonne): SelectFieldOption {
    const detail = member.fonction ?? MISSION_ROLE_LABELS[member.roles];
    return { value: String(member.personneId), label: `${member.nom} ${member.prenom} — ${detail}` };
  }
}

function emptyDraft(): InterviewDraft {
  return {
    personneIntervieweeId: '',
    dateInterview: '',
    fonction: '',
    anciennete: '',
    redigeParPersonneId: '',
    superviseParPersonneId: '',
    valideParPersonneId: '',
    dateRedaction: '',
    dateSupervision: '',
    dateValidation: ''
  };
}

function idText(id: number | null): string {
  return id === null ? '' : String(id);
}

function idOrNull(value: string): number | null {
  return value ? Number(value) : null;
}
