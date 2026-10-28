import { Component, computed, effect, inject, input } from '@angular/core';
import { Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';

import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { AUDIT_FILE_DOCUMENTS, AuditFileDocument } from '../../../missions/models/audit-file';
import { AuditFileStore } from '../../services/audit-file.store';

type NavigationState = 'done' | 'todo' | 'later';

interface NavigationItem extends AuditFileDocument {
  state: NavigationState;
  // Short text next to the label: number of declarations, "Étape 15"...
  hint: string;
}

@Component({
  selector: 'app-mission-workspace',
  standalone: true,
  imports: [EmptyStateComponent, IconButtonComponent, LoadingComponent, RouterLink, RouterLinkActive, RouterOutlet],
  providers: [AuditFileStore],
  templateUrl: './mission-workspace.component.html',
  styleUrl: './mission-workspace.component.scss'
})
export class MissionWorkspaceComponent {
  private readonly router = inject(Router);
  readonly store = inject(AuditFileStore);

  // Bound from the :id route parameter.
  readonly id = input.required<string>();

  readonly missionId = computed(() => Number(this.id()));

  readonly navigation = computed<NavigationItem[]>(() =>
    AUDIT_FILE_DOCUMENTS.map((document) => ({ ...document, ...this.describeState(document) }))
  );

  constructor() {
    effect(() => this.store.load(this.missionId()));
  }

  backToMission(): void {
    this.router.navigate(['/missions', this.missionId()]);
  }

  backToMissions(): void {
    this.router.navigate(['/missions']);
  }

  private describeState(document: AuditFileDocument): Pick<NavigationItem, 'state' | 'hint'> {
    switch (document.slug) {
      case null:
        return { state: 'later', hint: `Étape ${document.step}` };
      case 'ordre-de-mission':
        return { state: 'done', hint: '' };
      case 'tdr':
        return this.store.tdr() ? { state: 'done', hint: '' } : { state: 'todo', hint: '' };
      // Done as soon as one auditor has declared; the others may still add theirs.
      case 'declarations':
        return countState(this.store.declarations().length);
      case 'pv-ouverture':
        return this.store.openingReunion() ? { state: 'done', hint: '' } : { state: 'todo', hint: '' };
      case 'interviews':
        return countState(this.store.interviews().length);
      case 'programme':
        return countState(this.store.programme()?.lignes.length ?? 0);
      case 'tests':
        return countState(this.store.tests().length);
      case 'constats':
        return countState(this.store.constats().length);
      case 'pv-affirmation':
        return this.store.pvAffirmation() ? { state: 'done', hint: '' } : { state: 'todo', hint: '' };
      case 'rapport':
        return this.store.rapport() ? { state: 'done', hint: '' } : { state: 'todo', hint: '' };
      case 'pv-cloture':
        return this.store.closingReunion() ? { state: 'done', hint: '' } : { state: 'todo', hint: '' };
      // Done once the maintenance of every retained recommendation is decided.
      case 'recommandations': {
        const lignes = this.store.tableauRecommandations()?.lignes ?? [];
        const decided = lignes.length > 0 && lignes.every((ligne) => ligne.recommandationMaintenue !== null);
        return { state: decided ? 'done' : 'todo', hint: lignes.length > 0 ? String(lignes.length) : '' };
      }
      default:
        return { state: 'todo', hint: '' };
    }
  }
}

// Documents made of several items (interviews, programme lines, tests, constats): done with one, the hint gives how many.
function countState(count: number): Pick<NavigationItem, 'state' | 'hint'> {
  return { state: count > 0 ? 'done' : 'todo', hint: count > 0 ? String(count) : '' };
}
