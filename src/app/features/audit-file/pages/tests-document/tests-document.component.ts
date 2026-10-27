import { DatePipe } from '@angular/common';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';
import { Router } from '@angular/router';

import { injectActionRunner } from '../../../../core/http/action-runner';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CheckboxFieldComponent } from '../../../../shared/components/checkbox-field/checkbox-field.component';
import { DocumentSheetComponent } from '../../../../shared/components/document-sheet/document-sheet.component';
import { DocumentToolbarComponent } from '../../../../shared/components/document-toolbar/document-toolbar.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SelectFieldComponent } from '../../../../shared/components/select-field/select-field.component';
import { SelectFieldOption } from '../../../../shared/components/select-field/select-field.interface';
import { TextareaFieldComponent } from '../../../../shared/components/textarea-field/textarea-field.component';
import { todayAsText } from '../../../missions/models/mission-labels';
import { MissionRole } from '../../../missions/models/mission-personne.model';
import { DocumentListItemComponent } from '../../components/document-list-item/document-list-item.component';
import { DocumentSplitComponent } from '../../components/document-split/document-split.component';
import { AuditTest, AuditTestRequest, TEST_RESULT_LABELS, TestResult } from '../../models/audit-test.model';
import { AuditFileStore } from '../../services/audit-file.store';
import { AuditTestService } from '../../services/audit-test.service';

interface TestDraft {
  ligneProgrammeId: string;
  dateTest: string;
  procedureRealisee: string;
  resumeAnomalies: string;
  resultatTest: string;
  recommandations: string;
  commentairesChefMission: string;
  commentairesSuperviseur: string;
  auditeurMissionPersonneId: string;
  dateAudit: string;
  chefMissionMissionPersonneId: string;
  dateRevueChefMission: string;
  superviseurMissionPersonneId: string;
  dateRevueSuperviseur: string;
}

interface EchantillonDraft {
  id: number | null;
  anomalieDetectee: boolean;
  observation: string;
}

@Component({
  selector: 'app-tests-document',
  standalone: true,
  imports: [
    ButtonComponent,
    CheckboxFieldComponent,
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
  templateUrl: './tests-document.component.html',
  styleUrl: './tests-document.component.scss'
})
export class TestsDocumentComponent {
  private readonly testService = inject(AuditTestService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly runAction = injectActionRunner();
  readonly store = inject(AuditFileStore);

  readonly mission = this.store.mission;
  readonly tests = this.store.tests;
  readonly resultLabels: Record<string, string> = TEST_RESULT_LABELS;

  readonly selectedId = linkedSignal<number | null>(() => this.tests()[0]?.id ?? null);
  readonly selected = computed(() => this.tests().find((test) => test.id === this.selectedId()) ?? null);

  readonly editing = signal<AuditTest | 'new' | null>(null);
  readonly draft = signal<TestDraft>(emptyDraft());
  readonly risqueMaitrise = signal<boolean>(false);
  readonly echantillons = signal<EchantillonDraft[]>([]);
  readonly showErrors = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly testToDelete = signal<AuditTest | null>(null);
  readonly deleting = signal<boolean>(false);

  readonly lignes = computed(() => this.store.programme()?.lignes ?? []);
  readonly ligneOptions = computed<SelectFieldOption[]>(() =>
    this.lignes().map((ligne) => ({
      value: String(ligne.id),
      label: `${ligne.numeroControle} — ${ligne.tacheOperation ?? ligne.objectifDescription}`
    }))
  );
  readonly resultOptions: SelectFieldOption[] = (Object.keys(TEST_RESULT_LABELS) as TestResult[]).map((result) => ({
    value: result,
    label: TEST_RESULT_LABELS[result]
  }));
  // The quality review is done by the members who have the matching role in the mission.
  readonly auditeurOptions = computed(() => this.memberOptions('AUDITEUR'));
  readonly chefOptions = computed(() => this.memberOptions('CHEF_MISSION'));
  readonly superviseurOptions = computed(() => this.memberOptions('SUPERVISEUR'));

  readonly ligneError = computed(() =>
    this.showErrors() && !this.draft().ligneProgrammeId ? 'Choisissez la ligne du programme testée.' : null
  );

  readonly toolbarTitle = computed(() => {
    const editing = this.editing();
    return editing === 'new' ? 'Nouvelle fiche de test' : editing ? `Modifier la fiche ${editing.reference}` : 'Fiches de test';
  });

  select(test: AuditTest): void {
    this.selectedId.set(test.id);
  }

  startCreating(): void {
    this.draft.set({ ...emptyDraft(), dateTest: todayAsText(), ligneProgrammeId: idText(this.lignes()[0]?.id ?? null) });
    this.risqueMaitrise.set(false);
    this.echantillons.set([{ id: null, anomalieDetectee: false, observation: '' }]);
    this.showErrors.set(false);
    this.editing.set('new');
  }

  startEditing(test: AuditTest): void {
    this.draft.set({
      ligneProgrammeId: String(test.ligneProgrammeId),
      dateTest: test.dateTest ?? '',
      procedureRealisee: test.procedureRealisee ?? '',
      resumeAnomalies: test.resumeAnomalies ?? '',
      resultatTest: test.resultatTest ?? '',
      recommandations: test.recommandations ?? '',
      commentairesChefMission: test.commentairesChefMission ?? '',
      commentairesSuperviseur: test.commentairesSuperviseur ?? '',
      auditeurMissionPersonneId: idText(test.auditeurMissionPersonneId),
      dateAudit: test.dateAudit ?? '',
      chefMissionMissionPersonneId: idText(test.chefMissionMissionPersonneId),
      dateRevueChefMission: test.dateRevueChefMission ?? '',
      superviseurMissionPersonneId: idText(test.superviseurMissionPersonneId),
      dateRevueSuperviseur: test.dateRevueSuperviseur ?? ''
    });
    this.risqueMaitrise.set(test.risqueMaitrise ?? false);
    this.echantillons.set(
      test.echantillons.map((echantillon) => ({
        id: echantillon.id,
        anomalieDetectee: echantillon.anomalieDetectee,
        observation: echantillon.observation ?? ''
      }))
    );
    this.showErrors.set(false);
    this.editing.set(test);
  }

  cancelEditing(): void {
    this.editing.set(null);
  }

  updateField(field: keyof TestDraft, value: string): void {
    this.draft.update((draft) => ({ ...draft, [field]: value }));
  }

  addEchantillon(): void {
    this.echantillons.update((echantillons) => [...echantillons, { id: null, anomalieDetectee: false, observation: '' }]);
  }

  updateEchantillon(index: number, changes: Partial<EchantillonDraft>): void {
    this.echantillons.update((echantillons) =>
      echantillons.map((echantillon, position) => (position === index ? { ...echantillon, ...changes } : echantillon))
    );
  }

  removeEchantillon(index: number): void {
    this.echantillons.update((echantillons) => echantillons.filter((_, position) => position !== index));
  }

  save(): void {
    const editing = this.editing();
    this.showErrors.set(true);

    if (!editing || this.ligneError()) {
      return;
    }

    const draft = this.draft();
    const text = (value: string): string | null => value.trim() || null;
    const request: AuditTestRequest = {
      ligneProgrammeId: Number(draft.ligneProgrammeId),
      dateTest: draft.dateTest || null,
      procedureRealisee: text(draft.procedureRealisee),
      resumeAnomalies: text(draft.resumeAnomalies),
      resultatTest: draft.resultatTest || null,
      risqueMaitrise: this.risqueMaitrise(),
      recommandations: text(draft.recommandations),
      commentairesChefMission: text(draft.commentairesChefMission),
      commentairesSuperviseur: text(draft.commentairesSuperviseur),
      auditeurMissionPersonneId: idOrNull(draft.auditeurMissionPersonneId),
      dateAudit: draft.dateAudit || null,
      chefMissionMissionPersonneId: idOrNull(draft.chefMissionMissionPersonneId),
      dateRevueChefMission: draft.dateRevueChefMission || null,
      superviseurMissionPersonneId: idOrNull(draft.superviseurMissionPersonneId),
      dateRevueSuperviseur: draft.dateRevueSuperviseur || null,
      echantillons: this.echantillons().map((echantillon) => ({
        id: echantillon.id,
        anomalieDetectee: echantillon.anomalieDetectee,
        observation: text(echantillon.observation)
      }))
    };

    const save$ = editing === 'new' ? this.testService.create(request) : this.testService.update(editing.id, request);

    this.runAction(save$, this.saving, (saved) => {
      this.tests.update((tests) => [...tests.filter((test) => test.id !== saved.id), saved]);
      this.selectedId.set(saved.id);
      this.editing.set(null);
      this.toastService.success(`La fiche de test ${saved.reference} est enregistrée.`);
    });
  }

  confirmDeletion(): void {
    const test = this.testToDelete();

    if (!test) {
      return;
    }

    this.runAction(
      this.testService.delete(test.id),
      this.deleting,
      () => {
        this.tests.update((tests) => tests.filter((item) => item.id !== test.id));
        this.testToDelete.set(null);
        this.toastService.success(`La fiche de test ${test.reference} a été supprimée.`);
      },
      () => this.testToDelete.set(null)
    );
  }

  openProgramme(): void {
    const mission = this.mission();

    if (mission) {
      this.router.navigate(['/missions', mission.id, 'dossier', 'programme']);
    }
  }

  resultLabel(result: string | null): string {
    return result ? this.resultLabels[result] ?? result : 'Non renseigné';
  }

  personName(nom: string | null, prenom: string | null): string {
    return nom ? `${nom} ${prenom ?? ''}`.trim() : '……………';
  }

  private memberOptions(role: MissionRole): SelectFieldOption[] {
    return this.store
      .membersWithRole(role)
      .map((member) => ({ value: String(member.missionPersonneId), label: `${member.nom} ${member.prenom}` }));
  }
}

function emptyDraft(): TestDraft {
  return {
    ligneProgrammeId: '',
    dateTest: '',
    procedureRealisee: '',
    resumeAnomalies: '',
    resultatTest: '',
    recommandations: '',
    commentairesChefMission: '',
    commentairesSuperviseur: '',
    auditeurMissionPersonneId: '',
    dateAudit: '',
    chefMissionMissionPersonneId: '',
    dateRevueChefMission: '',
    superviseurMissionPersonneId: '',
    dateRevueSuperviseur: ''
  };
}

function idText(id: number | null): string {
  return id === null ? '' : String(id);
}

function idOrNull(value: string): number | null {
  return value ? Number(value) : null;
}
