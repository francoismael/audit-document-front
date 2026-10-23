import { DatePipe } from '@angular/common';
import { Component, computed, inject, linkedSignal, signal } from '@angular/core';

import { injectActionRunner } from '../../../../core/http/action-runner';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DocumentSheetComponent } from '../../../../shared/components/document-sheet/document-sheet.component';
import { DocumentToolbarComponent } from '../../../../shared/components/document-toolbar/document-toolbar.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { MISSION_ROLE_LABELS } from '../../../missions/models/mission-labels';
import { MissionPersonne } from '../../../missions/models/mission-personne.model';
import { DeclarationFormModalComponent } from '../../components/declaration-form-modal/declaration-form-modal.component';
import { DeclarationIndependance } from '../../models/declaration-independance.model';
import { AuditFileStore } from '../../services/audit-file.store';
import { DeclarationIndependanceService } from '../../services/declaration-independance.service';

interface Declarant {
  member: MissionPersonne;
  declaration: DeclarationIndependance | null;
}

@Component({
  selector: 'app-declarations-document',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    DeclarationFormModalComponent,
    DocumentSheetComponent,
    DocumentToolbarComponent,
    EmptyStateComponent,
    IconButtonComponent,
    ModalComponent
  ],
  templateUrl: './declarations-document.component.html',
  styleUrl: './declarations-document.component.scss'
})
export class DeclarationsDocumentComponent {
  private readonly declarationService = inject(DeclarationIndependanceService);
  private readonly toastService = inject(ToastService);
  private readonly runAction = injectActionRunner();
  readonly store = inject(AuditFileStore);

  readonly mission = this.store.mission;
  readonly roleLabels = MISSION_ROLE_LABELS;

  readonly declarants = computed<Declarant[]>(() =>
    this.store.declarants().map((member) => ({
      member,
      declaration: this.store.declarations().find((declaration) => declaration.personneId === member.personneId) ?? null
    }))
  );
  readonly signedCount = computed(() => this.declarants().filter((declarant) => declarant.declaration).length);

  // The document is complete with one declaration; the other auditors may still add theirs.
  readonly description = computed(() =>
    this.signedCount() === 0
      ? 'Aucune déclaration : un auditeur de la mission établit la sienne.'
      : `${this.signedCount()} déclaration(s) établie(s). Les autres auditeurs peuvent aussi établir la leur.`
  );

  // The letter shown on the right; the first member by default.
  readonly selectedPersonneId = linkedSignal<number | null>(() => this.declarants()[0]?.member.personneId ?? null);
  readonly selected = computed(
    () => this.declarants().find((declarant) => declarant.member.personneId === this.selectedPersonneId()) ?? null
  );

  readonly formFor = signal<Declarant | null>(null);
  readonly saving = signal<boolean>(false);
  readonly deletionFor = signal<Declarant | null>(null);
  readonly deleting = signal<boolean>(false);

  fullName(member: MissionPersonne): string {
    return `${member.nom} ${member.prenom}`;
  }

  select(declarant: Declarant): void {
    this.selectedPersonneId.set(declarant.member.personneId);
  }

  openForm(declarant: Declarant): void {
    this.select(declarant);
    this.formFor.set(declarant);
  }

  saveDeclaration(dateDeclaration: string): void {
    const declarant = this.formFor();
    const mission = this.mission();

    if (!declarant || !mission) {
      return;
    }

    const request = { missionId: mission.id, personneId: declarant.member.personneId, dateDeclaration };
    const existing = declarant.declaration;
    const save$ = existing
      ? this.declarationService.update(existing.id, request)
      : this.declarationService.create(request);

    this.runAction(save$, this.saving, (saved) => {
      this.store.declarations.update((declarations) => [
        ...declarations.filter((declaration) => declaration.id !== saved.id),
        saved
      ]);
      this.formFor.set(null);
      this.toastService.success(`La déclaration de ${saved.nom} ${saved.prenom} est enregistrée.`);
    });
  }

  confirmDeletion(): void {
    const declaration = this.deletionFor()?.declaration;

    if (!declaration) {
      return;
    }

    this.runAction(
      this.declarationService.delete(declaration.id),
      this.deleting,
      () => {
        this.store.declarations.update((declarations) => declarations.filter((item) => item.id !== declaration.id));
        this.deletionFor.set(null);
        this.toastService.success('La déclaration a été supprimée.');
      },
      () => this.deletionFor.set(null)
    );
  }
}
