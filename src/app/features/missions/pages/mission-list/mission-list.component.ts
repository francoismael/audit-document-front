import { formatDate } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { catchError, from, map, switchMap, tap } from 'rxjs';

import { injectActionRunner } from '../../../../core/http/action-runner';
import { readApiErrorMessage } from '../../../../core/http/api-error';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DataTableCellDirective } from '../../../../shared/components/data-table/data-table-cell.directive';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { DataTableColumn, DataTableRow } from '../../../../shared/components/data-table/data-table.interface';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { SelectFieldComponent } from '../../../../shared/components/select-field/select-field.component';
import { SelectFieldOption } from '../../../../shared/components/select-field/select-field.interface';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { StatusBadgeStatus } from '../../../../shared/components/status-badge/status-badge.interface';
import { normalizeForSearch } from '../../../../shared/utils/search';
import { MissionFormModalComponent } from '../../components/mission-form-modal/mission-form-modal.component';
import {
  MISSION_STATUS_BADGES,
  MISSION_STATUS_LABELS,
  MissionStatus,
  getMissionStatus,
  todayAsText
} from '../../models/mission-labels';
import { Mission, MissionRequest } from '../../models/mission.model';
import { MissionService } from '../../services/mission.service';
import { MissionDetailComponent } from '../mission-detail/mission-detail.component';

type MissionLoadResult = { missions: Mission[] } | { error: string };

@Component({
  selector: 'app-mission-list',
  standalone: true,
  imports: [
    ButtonComponent,
    DataTableCellDirective,
    DataTableComponent,
    EmptyStateComponent,
    IconButtonComponent,
    LoadingComponent,
    MissionFormModalComponent,
    ModalComponent,
    PageHeaderComponent,
    RouterOutlet,
    SearchInputComponent,
    SelectFieldComponent,
    StatusBadgeComponent
  ],
  templateUrl: './mission-list.component.html',
  styleUrl: './mission-list.component.scss'
})
export class MissionListComponent {
  private readonly missionService = inject(MissionService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly runAction = injectActionRunner();

  readonly missions = signal<Mission[]>([]);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  // Changing it reloads the list.
  private readonly reloadCount = signal<number>(0);

  readonly search = signal<string>('');
  readonly statusFilter = signal<string>('');

  readonly formOpen = signal<boolean>(false);
  readonly editedMission = signal<Mission | null>(null);
  readonly saving = signal<boolean>(false);
  readonly missionToDelete = signal<Mission | null>(null);
  readonly deleting = signal<boolean>(false);

  readonly statusOptions: SelectFieldOption[] = (Object.keys(MISSION_STATUS_LABELS) as MissionStatus[]).map(
    (status) => ({ value: status, label: MISSION_STATUS_LABELS[status] })
  );

  readonly hasFilters = computed(() => !!(this.search().trim() || this.statusFilter()));

  readonly visibleMissions = computed(() => {
    const query = normalizeForSearch(this.search().trim());
    const today = todayAsText();

    return this.missions().filter((mission) => {
      const matchesStatus = !this.statusFilter() || getMissionStatus(mission, today) === this.statusFilter();
      const matchesQuery =
        !query ||
        [mission.numero, mission.intitule, mission.structureNom ?? ''].some((text) =>
          normalizeForSearch(text).includes(query)
        );

      return matchesStatus && matchesQuery;
    });
  });

  readonly columns: DataTableColumn[] = [
    { key: 'numero', label: 'N°' },
    { key: 'intitule', label: 'Intitulé' },
    { key: 'structure', label: 'Structure auditée' },
    { key: 'periode', label: 'Période' },
    { key: 'status', label: 'Statut' },
    { key: 'equipe', label: 'Équipe', align: 'center' },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  readonly rows = computed<DataTableRow[]>(() =>
    this.visibleMissions().map((mission) => ({
      id: mission.id,
      numero: mission.numero,
      intitule: mission.intitule,
      structure: mission.structureNom ?? '—',
      periode: formatPeriod(mission),
      equipe: mission.personnes.length
    }))
  );

  constructor() {
    toObservable(this.reloadCount)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.errorMessage.set(null);
        }),
        switchMap(() =>
          this.missionService.getAll().pipe(
            map((missions): MissionLoadResult => ({ missions })),
            catchError((error: unknown) => from(readApiErrorMessage(error)).pipe(map((message) => ({ error: message }))))
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((result) => {
        if ('error' in result) {
          this.errorMessage.set(result.error);
        } else {
          this.missions.set(result.missions);
        }

        this.loading.set(false);
      });
  }

  reloadMissions(): void {
    this.reloadCount.update((count) => count + 1);
  }

  resetFilters(): void {
    this.search.set('');
    this.statusFilter.set('');
  }

  findMission(row: DataTableRow): Mission | null {
    return this.missions().find((mission) => mission.id === row['id']) ?? null;
  }

  statusLabel(mission: Mission): string {
    return MISSION_STATUS_LABELS[getMissionStatus(mission, todayAsText())];
  }

  statusBadge(mission: Mission): StatusBadgeStatus {
    return MISSION_STATUS_BADGES[getMissionStatus(mission, todayAsText())];
  }

  openDetail(mission: Mission): void {
    this.router.navigate(['/missions', mission.id]);
  }

  openCreateForm(): void {
    this.editedMission.set(null);
    this.formOpen.set(true);
  }

  openEditForm(mission: Mission): void {
    this.editedMission.set(mission);
    this.formOpen.set(true);
  }

  saveMission(request: MissionRequest): void {
    const edited = this.editedMission();

    if (edited) {
      this.runAction(this.missionService.update(edited.id, request), this.saving, (mission) => {
        this.replaceMission(mission);
        this.formOpen.set(false);
        this.toastService.success(`La mission n° ${mission.numero} a été modifiée.`);
      });
      return;
    }

    // POST returns the raw entity: the list is reloaded to get the full mission, then its drawer is opened.
    this.runAction(this.missionService.create(request), this.saving, (created) => {
      this.formOpen.set(false);
      this.toastService.success(`La mission n° ${created.numero} a été créée.`);
      this.reloadMissions();
      this.router.navigate(['/missions', created.id]);
    });
  }

  askDelete(mission: Mission): void {
    this.missionToDelete.set(mission);
  }

  confirmDelete(): void {
    const deleted = this.missionToDelete();

    if (!deleted) {
      return;
    }

    this.runAction(
      this.missionService.delete(deleted.id),
      this.deleting,
      () => {
        this.missions.update((missions) => missions.filter((mission) => mission.id !== deleted.id));
        this.missionToDelete.set(null);
        this.toastService.success(`La mission n° ${deleted.numero} a été supprimée.`);
        this.router.navigate(['/missions']);
      },
      () => this.missionToDelete.set(null)
    );
  }

  // Keeps the row up to date when the mission is modified in the drawer.
  onPanelOpened(component: unknown): void {
    if (component instanceof MissionDetailComponent) {
      component.missionChanged.subscribe((mission) => this.replaceMission(mission));
    }
  }

  private replaceMission(updated: Mission): void {
    this.missions.update((missions) => missions.map((mission) => (mission.id === updated.id ? updated : mission)));
  }
}

function formatPeriod(mission: Mission): string {
  const format = (date: string | null): string => (date ? formatDate(date, 'dd/MM/yyyy', 'en-US') : '…');

  if (!mission.dateDebut && !mission.dateFin) {
    return 'Non définie';
  }

  return `${format(mission.dateDebut)} → ${format(mission.dateFin)}`;
}
