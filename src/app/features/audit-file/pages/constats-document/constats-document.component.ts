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
import { DocumentListItemComponent } from '../../components/document-list-item/document-list-item.component';
import { DocumentSplitComponent } from '../../components/document-split/document-split.component';
import {
  Constat,
  ConstatItemRequest,
  ConstatRecommandationRequest,
  ConstatRequest,
  ConstatRisqueRequest,
  RISK_LEVEL_LABELS,
  RiskLevel
} from '../../models/constat.model';
import { AuditFileStore } from '../../services/audit-file.store';
import { ConstatService } from '../../services/constat.service';

type ConstatView = 'fiche' | 'tableau';
type ItemList = 'causes' | 'consequences';

interface ConstatDraft {
  testId: string;
  descriptions: string;
  niveauRisque: string;
  directionServiceConcerne: string;
}

// Constats of one TDR objective, for the summary table (model n°01).
interface ObjectiveGroup {
  objectifId: number;
  title: string;
  constats: Constat[];
}

@Component({
  selector: 'app-constats-document',
  standalone: true,
  imports: [
    ButtonComponent,
    CheckboxFieldComponent,
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
  templateUrl: './constats-document.component.html',
  styleUrl: './constats-document.component.scss'
})
export class ConstatsDocumentComponent {
  private readonly constatService = inject(ConstatService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly runAction = injectActionRunner();
  readonly store = inject(AuditFileStore);

  readonly mission = this.store.mission;
  readonly constats = this.store.constats;
  readonly itemLists: ItemList[] = ['causes', 'consequences'];

  readonly view = signal<ConstatView>('fiche');
  readonly selectedId = linkedSignal<number | null>(() => this.constats()[0]?.id ?? null);
  readonly selected = computed(() => this.constats().find((constat) => constat.id === this.selectedId()) ?? null);

  readonly editing = signal<Constat | 'new' | null>(null);
  readonly draft = signal<ConstatDraft>(emptyDraft());
  readonly causes = signal<ConstatItemRequest[]>([]);
  readonly consequences = signal<ConstatItemRequest[]>([]);
  readonly risques = signal<ConstatRisqueRequest[]>([]);
  readonly recommandations = signal<ConstatRecommandationRequest[]>([]);
  readonly showErrors = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly constatToDelete = signal<Constat | null>(null);
  readonly deleting = signal<boolean>(false);

  readonly tests = this.store.tests;
  readonly testOptions = computed<SelectFieldOption[]>(() =>
    this.tests().map((test) => ({
      value: String(test.id),
      label: `${test.reference} — contrôle ${test.numeroControle}${test.tacheOperation ? ' · ' + test.tacheOperation : ''}`
    }))
  );
  readonly levelOptions: SelectFieldOption[] = (Object.keys(RISK_LEVEL_LABELS) as RiskLevel[]).map((level) => ({
    value: level,
    label: RISK_LEVEL_LABELS[level]
  }));

  readonly testError = computed(() => (this.showErrors() && !this.draft().testId ? 'Choisissez le test à l\'origine du constat.' : null));
  readonly descriptionError = computed(() =>
    this.showErrors() && !this.draft().descriptions.trim() ? 'La description du constat est obligatoire.' : null
  );
  readonly itemsError = computed(() => {
    const empty = [...this.causes(), ...this.consequences(), ...this.risques()].some((item) => !item.descriptions.trim()) ||
      this.recommandations().some((item) => !item.description.trim());
    return this.showErrors() && empty ? 'Chaque élément ajouté (cause, risque, conséquence, recommandation) doit avoir un texte.' : null;
  });

  // Model n°01: the constats grouped by objective, in the order of the TDR.
  readonly groups = computed<ObjectiveGroup[]>(() => {
    const order = new Map((this.store.tdr()?.objectifs ?? []).map((objectif, index) => [objectif.id, index]));
    const groups = new Map<number, ObjectiveGroup>();

    for (const constat of this.constats()) {
      const group = groups.get(constat.objectifId) ?? {
        objectifId: constat.objectifId,
        title: `${constat.objectifNumero} : ${constat.objectifDescription}`,
        constats: []
      };
      group.constats.push(constat);
      groups.set(constat.objectifId, group);
    }

    return [...groups.values()].sort((first, second) => (order.get(first.objectifId) ?? 0) - (order.get(second.objectifId) ?? 0));
  });

  readonly toolbarTitle = computed(() => {
    const editing = this.editing();
    return editing === 'new' ? 'Nouveau constat' : editing ? `Modifier le constat ${editing.reference}` : 'Fiches de constats';
  });

  select(constat: Constat): void {
    this.selectedId.set(constat.id);
  }

  startCreating(): void {
    this.draft.set({ ...emptyDraft(), testId: this.tests()[0] ? String(this.tests()[0].id) : '' });
    this.causes.set([{ id: null, descriptions: '' }]);
    this.consequences.set([{ id: null, descriptions: '' }]);
    this.risques.set([{ id: null, descriptions: '', niveau: null }]);
    this.recommandations.set([{ id: null, description: '', retenue: true }]);
    this.showErrors.set(false);
    this.editing.set('new');
  }

  startEditing(constat: Constat): void {
    this.draft.set({
      testId: String(constat.testId),
      descriptions: constat.descriptions,
      niveauRisque: constat.niveauRisque ?? '',
      directionServiceConcerne: constat.directionServiceConcerne ?? ''
    });
    this.causes.set(constat.causes.map((item) => ({ id: item.id, descriptions: item.descriptions })));
    this.consequences.set(constat.consequences.map((item) => ({ id: item.id, descriptions: item.descriptions })));
    this.risques.set(constat.risques.map((item) => ({ id: item.id, descriptions: item.descriptions, niveau: item.niveau })));
    this.recommandations.set(
      constat.recommandations.map((item) => ({ id: item.id, description: item.description, retenue: item.retenue }))
    );
    this.showErrors.set(false);
    this.editing.set(constat);
  }

  cancelEditing(): void {
    this.editing.set(null);
  }

  updateField(field: keyof ConstatDraft, value: string): void {
    this.draft.update((draft) => ({ ...draft, [field]: value }));
  }

  // Causes and consequences: a list of texts.
  itemsOf(list: ItemList): ConstatItemRequest[] {
    return list === 'causes' ? this.causes() : this.consequences();
  }

  addItem(list: ItemList): void {
    this.listSignal(list).update((items) => [...items, { id: null, descriptions: '' }]);
  }

  updateItem(list: ItemList, index: number, descriptions: string): void {
    this.listSignal(list).update((items) => items.map((item, position) => (position === index ? { ...item, descriptions } : item)));
  }

  removeItem(list: ItemList, index: number): void {
    this.listSignal(list).update((items) => items.filter((_, position) => position !== index));
  }

  addRisque(): void {
    this.risques.update((risques) => [...risques, { id: null, descriptions: '', niveau: null }]);
  }

  updateRisque(index: number, changes: Partial<ConstatRisqueRequest>): void {
    this.risques.update((risques) => risques.map((risque, position) => (position === index ? { ...risque, ...changes } : risque)));
  }

  removeRisque(index: number): void {
    this.risques.update((risques) => risques.filter((_, position) => position !== index));
  }

  addRecommandation(): void {
    this.recommandations.update((items) => [...items, { id: null, description: '', retenue: items.length === 0 }]);
  }

  updateRecommandation(index: number, description: string): void {
    this.recommandations.update((items) => items.map((item, position) => (position === index ? { ...item, description } : item)));
  }

  // Only one recommendation can be retained: retaining one releases the others.
  retainRecommandation(index: number, retenue: boolean): void {
    this.recommandations.update((items) =>
      items.map((item, position) => ({ ...item, retenue: position === index ? retenue : retenue ? false : item.retenue }))
    );
  }

  removeRecommandation(index: number): void {
    this.recommandations.update((items) => items.filter((_, position) => position !== index));
  }

  save(): void {
    const editing = this.editing();
    this.showErrors.set(true);

    if (!editing || this.testError() || this.descriptionError() || this.itemsError()) {
      return;
    }

    const draft = this.draft();
    const request: ConstatRequest = {
      testId: Number(draft.testId),
      descriptions: draft.descriptions.trim(),
      niveauRisque: draft.niveauRisque || null,
      directionServiceConcerne: draft.directionServiceConcerne.trim() || null,
      causes: this.causes().map((item) => ({ ...item, descriptions: item.descriptions.trim() })),
      risques: this.risques().map((item) => ({ ...item, descriptions: item.descriptions.trim() })),
      consequences: this.consequences().map((item) => ({ ...item, descriptions: item.descriptions.trim() })),
      recommandations: this.recommandations().map((item) => ({ ...item, description: item.description.trim() }))
    };

    const save$ = editing === 'new' ? this.constatService.create(request) : this.constatService.update(editing.id, request);

    this.runAction(save$, this.saving, (saved) => {
      this.constats.update((constats) => [...constats.filter((constat) => constat.id !== saved.id), saved]);
      this.selectedId.set(saved.id);
      this.editing.set(null);
      this.toastService.success(`Le constat ${saved.reference} est enregistré.`);
    });
  }

  confirmDeletion(): void {
    const constat = this.constatToDelete();

    if (!constat) {
      return;
    }

    this.runAction(
      this.constatService.delete(constat.id),
      this.deleting,
      () => {
        this.constats.update((constats) => constats.filter((item) => item.id !== constat.id));
        this.constatToDelete.set(null);
        this.toastService.success(`Le constat ${constat.reference} a été supprimé.`);
      },
      () => this.constatToDelete.set(null)
    );
  }

  openTests(): void {
    const mission = this.mission();

    if (mission) {
      this.router.navigate(['/missions', mission.id, 'dossier', 'tests']);
    }
  }

  levelLabel(level: string | null): string {
    return level ? RISK_LEVEL_LABELS[level as RiskLevel] ?? level : '—';
  }

  private listSignal(list: ItemList): typeof this.causes {
    return list === 'causes' ? this.causes : this.consequences;
  }
}

function emptyDraft(): ConstatDraft {
  return { testId: '', descriptions: '', niveauRisque: '', directionServiceConcerne: '' };
}
