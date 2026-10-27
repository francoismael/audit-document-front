import { Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';

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
import { LigneProgramme, LigneProgrammeFields, ProgrammeTravailRequest } from '../../models/programme-travail.model';
import { AuditFileStore } from '../../services/audit-file.store';
import { ProgrammeTravailService } from '../../services/programme-travail.service';

// A line being edited: every field as text, the objective as the value of its select.
type LigneDraft = { id: number | null; objectifId: string } & Record<keyof LigneProgrammeFields, string>;

// A line of the printed table, with the number of lines of its objective on its first line (rowspan).
interface ProgrammeRow {
  ligne: LigneProgramme;
  objectifRowspan: number;
}

const FIELDS: (keyof LigneProgrammeFields)[] = [
  'tacheOperation',
  'faiblesseAConfirmer',
  'responsable',
  'frequence',
  'typeControle',
  'domaineCycle',
  'risque',
  'procedureTest',
  'echantillonDescription',
  'techniqueAudit',
  'techniqueEchantillonnage'
];

@Component({
  selector: 'app-programme-document',
  standalone: true,
  imports: [
    ButtonComponent,
    DocumentSheetComponent,
    DocumentToolbarComponent,
    EmptyStateComponent,
    FormFieldComponent,
    IconButtonComponent,
    ModalComponent,
    SelectFieldComponent,
    TextareaFieldComponent
  ],
  templateUrl: './programme-document.component.html',
  styleUrl: './programme-document.component.scss'
})
export class ProgrammeDocumentComponent {
  private readonly programmeService = inject(ProgrammeTravailService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly runAction = injectActionRunner();
  readonly store = inject(AuditFileStore);

  readonly mission = this.store.mission;
  readonly programme = this.store.programme;

  readonly editing = signal<boolean>(false);
  readonly lignes = signal<LigneDraft[]>([]);
  readonly showErrors = signal<boolean>(false);
  readonly saving = signal<boolean>(false);
  readonly confirmingDeletion = signal<boolean>(false);
  readonly deleting = signal<boolean>(false);

  readonly objectifs = computed(() => this.store.tdr()?.objectifs ?? []);
  readonly objectifOptions = computed<SelectFieldOption[]>(() =>
    this.objectifs().map((objectif) => ({ value: String(objectif.id), label: `${objectif.numero} — ${objectif.descriptions}` }))
  );
  readonly typeControleOptions: SelectFieldOption[] = [
    { value: 'Manuel', label: 'Manuel' },
    { value: 'Automatique', label: 'Automatique' }
  ];

  readonly lignesError = computed(() =>
    this.showErrors() && this.lignes().some((ligne) => !ligne.objectifId) ? 'Chaque ligne doit être rattachée à un objectif du TDR.' : null
  );

  // Lines grouped by objective, in the order of the TDR, as in the table of Document.docx.
  readonly rows = computed<ProgrammeRow[]>(() => {
    const order = new Map(this.objectifs().map((objectif, index) => [objectif.id, index]));
    const lignes = [...(this.programme()?.lignes ?? [])].sort(
      (first, second) => (order.get(first.objectifId) ?? 0) - (order.get(second.objectifId) ?? 0)
    );

    return lignes.map((ligne, index) => {
      const firstOfObjective = index === 0 || lignes[index - 1].objectifId !== ligne.objectifId;
      return {
        ligne,
        objectifRowspan: firstOfObjective ? lignes.filter((other) => other.objectifId === ligne.objectifId).length : 0
      };
    });
  });

  startEditing(): void {
    const programme = this.programme();

    this.lignes.set(
      programme
        ? programme.lignes.map((ligne) => toDraft(ligne))
        : [emptyLigne(this.objectifs()[0]?.id ?? null)]
    );
    this.showErrors.set(false);
    this.editing.set(true);
  }

  cancelEditing(): void {
    this.editing.set(false);
  }

  addLigne(): void {
    const last = this.lignes()[this.lignes().length - 1];
    this.lignes.update((lignes) => [...lignes, emptyLigne(last ? Number(last.objectifId) || null : null)]);
  }

  updateLigne(index: number, field: keyof LigneDraft, value: string): void {
    this.lignes.update((lignes) => lignes.map((ligne, position) => (position === index ? { ...ligne, [field]: value } : ligne)));
  }

  removeLigne(index: number): void {
    this.lignes.update((lignes) => lignes.filter((_, position) => position !== index));
  }

  save(): void {
    const mission = this.mission();
    this.showErrors.set(true);

    if (!mission || this.lignesError()) {
      return;
    }

    const request: ProgrammeTravailRequest = {
      missionId: mission.id,
      lignes: this.lignes().map((ligne) => {
        return { ...mapFields((field) => ligne[field].trim() || null), id: ligne.id, objectifId: Number(ligne.objectifId) };
      })
    };

    const existing = this.programme();
    const save$ = existing ? this.programmeService.update(existing.id, request) : this.programmeService.create(request);

    this.runAction(save$, this.saving, (programme) => {
      this.store.programme.set(programme);
      this.editing.set(false);
      this.toastService.success('Le programme de travail est enregistré.');
    });
  }

  confirmDeletion(): void {
    const programme = this.programme();

    if (!programme) {
      return;
    }

    this.runAction(
      this.programmeService.delete(programme.id),
      this.deleting,
      () => {
        this.store.programme.set(null);
        this.confirmingDeletion.set(false);
        this.toastService.success('Le programme de travail a été supprimé.');
      },
      () => this.confirmingDeletion.set(false)
    );
  }

  openTdr(): void {
    const mission = this.mission();

    if (mission) {
      this.router.navigate(['/missions', mission.id, 'dossier', 'tdr']);
    }
  }
}

function emptyLigne(objectifId: number | null): LigneDraft {
  return {
    id: null,
    objectifId: objectifId === null ? '' : String(objectifId),
    ...mapFields(() => '')
  };
}

function toDraft(ligne: LigneProgramme): LigneDraft {
  return {
    id: ligne.id,
    objectifId: String(ligne.objectifId),
    ...mapFields((field) => ligne[field] ?? '')
  };
}

// The same value computed for each text field of a line.
function mapFields<T>(valueOf: (field: keyof LigneProgrammeFields) => T): Record<keyof LigneProgrammeFields, T> {
  const fields = {} as Record<keyof LigneProgrammeFields, T>;

  for (const field of FIELDS) {
    fields[field] = valueOf(field);
  }

  return fields;
}
