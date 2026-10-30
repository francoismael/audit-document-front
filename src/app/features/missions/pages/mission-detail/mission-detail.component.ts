import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable, catchError, forkJoin, from, map, of, switchMap, tap } from 'rxjs';

import { injectActionRunner } from '../../../../core/http/action-runner';
import { readApiErrorMessage } from '../../../../core/http/api-error';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DetailRowComponent } from '../../../../shared/components/detail-row/detail-row.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { ProgressBarComponent } from '../../../../shared/components/progress-bar/progress-bar.component';
import { SidePanelComponent } from '../../../../shared/components/side-panel/side-panel.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { TabItem } from '../../../../shared/components/tabs/tabs.interface';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
import { GeneratedDocument, documentTypeLabel } from '../../../document-history/models/generated-document.model';
import { DocumentHistoryService } from '../../../document-history/services/document-history.service';
import { MissionProgress } from '../../../statistics/models/statistics.model';
import { StatisticsService } from '../../../statistics/services/statistics.service';
import { MissionFormModalComponent } from '../../components/mission-form-modal/mission-form-modal.component';
import { AUDIT_FILE_DOCUMENTS, getAuditFileStatus } from '../../models/audit-file';
import {
  MISSION_ROLES,
  MISSION_ROLE_LABELS,
  MISSION_STATUS_BADGES,
  MISSION_STATUS_LABELS,
  getMissionStatus,
  todayAsText
} from '../../models/mission-labels';
import { Mission, MissionRequest } from '../../models/mission.model';
import { MissionService } from '../../services/mission.service';

type DetailTab = 'informations' | 'team' | 'file' | 'documents';

interface LoadedMission {
  mission: Mission;
  // Null when the progress cannot be loaded: the rest of the drawer stays usable.
  progress: MissionProgress | null;
  documents: GeneratedDocument[];
}

type MissionLoadResult = LoadedMission | { error: string };

@Component({
  selector: 'app-mission-detail',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    DetailRowComponent,
    EmptyStateComponent,
    FileSizePipe,
    IconButtonComponent,
    LoadingComponent,
    MissionFormModalComponent,
    ProgressBarComponent,
    SidePanelComponent,
    StatusBadgeComponent,
    TabsComponent
  ],
  templateUrl: './mission-detail.component.html',
  styleUrl: './mission-detail.component.scss'
})
export class MissionDetailComponent {
  readonly typeLabel = documentTypeLabel;

  private readonly missionService = inject(MissionService);
  private readonly statisticsService = inject(StatisticsService);
  private readonly documentHistoryService = inject(DocumentHistoryService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly runAction = injectActionRunner();

  // Bound from the :id route parameter. The component is reused when another mission is opened.
  readonly id = input.required<string>();

  // Lets the list show the changes right away.
  readonly missionChanged = output<Mission>();

  readonly loaded = signal<LoadedMission | null>(null);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly activeTab = signal<DetailTab>('informations');
  readonly formOpen = signal<boolean>(false);
  readonly saving = signal<boolean>(false);

  readonly missionId = computed(() => Number(this.id()));
  readonly mission = computed(() => this.loaded()?.mission ?? null);
  readonly roleLabels = MISSION_ROLE_LABELS;

  readonly status = computed(() => {
    const mission = this.mission();
    return mission ? getMissionStatus(mission, todayAsText()) : 'undated';
  });
  readonly statusLabel = computed(() => MISSION_STATUS_LABELS[this.status()]);
  readonly statusBadge = computed(() => MISSION_STATUS_BADGES[this.status()]);

  // The team grouped by role, in the order of the hierarchy, without empty groups.
  readonly teamByRole = computed(() => {
    const team = this.mission()?.personnes ?? [];

    return MISSION_ROLES.map((role) => ({
      role,
      label: MISSION_ROLE_LABELS[role],
      members: team.filter((member) => member.roles === role)
    })).filter((group) => group.members.length > 0);
  });

  readonly auditFile = computed(() =>
    AUDIT_FILE_DOCUMENTS.map((document) => ({
      ...document,
      status: getAuditFileStatus(document, this.loaded()?.progress ?? null)
    }))
  );

  readonly tabs = computed<TabItem[]>(() => [
    { id: 'informations', label: 'Informations' },
    { id: 'team', label: 'Équipe', count: this.mission()?.personnes.length ?? 0 },
    { id: 'file', label: "Dossier d'audit" },
    { id: 'documents', label: 'Documents générés', count: this.loaded()?.documents.length ?? 0 }
  ]);

  constructor() {
    toObservable(this.missionId)
      .pipe(
        tap(() => this.resetState()),
        switchMap((missionId) => this.fetchMission(missionId)),
        takeUntilDestroyed()
      )
      .subscribe((result) => {
        if ('error' in result) {
          this.errorMessage.set(result.error);
        } else {
          this.loaded.set(result);
        }

        this.loading.set(false);
      });
  }

  selectTab(tab: string): void {
    this.activeTab.set(tab as DetailTab);
  }

  saveMission(request: MissionRequest): void {
    this.runAction(this.missionService.update(this.missionId(), request), this.saving, (mission) => {
      const loaded = this.loaded();

      if (loaded) {
        this.loaded.set({ ...loaded, mission });
      }

      this.formOpen.set(false);
      this.missionChanged.emit(mission);
      this.toastService.success(`La mission n° ${mission.numero} a été modifiée.`);
    });
  }

  openDocument(document: GeneratedDocument): void {
    this.router.navigate(['/document-history', document.id]);
  }

  // Business documents are written in the mission workspace (full width).
  openWorkspace(slug = 'ordre-de-mission'): void {
    this.router.navigate(['/missions', this.missionId(), 'dossier', slug]);
  }

  openCatalog(): void {
    this.router.navigate(['/documents']);
  }

  close(): void {
    this.router.navigate(['/missions']);
  }

  private fetchMission(missionId: number): Observable<MissionLoadResult> {
    return this.missionService.getById(missionId).pipe(
      switchMap((mission) =>
        forkJoin({
          progress: this.statisticsService.getMissionProgress().pipe(
            map((progress) => progress.find((item) => item.missionId === missionId) ?? null),
            catchError(() => of(null))
          ),
          documents: this.documentHistoryService
            .getAll({ documentTypeId: null, missionId })
            .pipe(catchError(() => of([])))
        }).pipe(map(({ progress, documents }) => ({ mission, progress, documents })))
      ),
      catchError((error: unknown) => from(readApiErrorMessage(error)).pipe(map((message) => ({ error: message }))))
    );
  }

  private resetState(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.loaded.set(null);
    this.activeTab.set('informations');
    this.formOpen.set(false);
  }
}
