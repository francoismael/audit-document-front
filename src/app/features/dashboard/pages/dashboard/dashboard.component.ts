import { formatDate } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { ChartConfiguration } from 'chart.js';
import { catchError, forkJoin, from, map, switchMap, tap } from 'rxjs';

import { readApiErrorMessage } from '../../../../core/http/api-error';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { CHART_COLORS } from '../../../../shared/components/chart/chart-palette';
import { BAR_VALUE_LABELS } from '../../../../shared/components/chart/chart-plugins';
import { ChartComponent } from '../../../../shared/components/chart/chart.component';
import { DataTableCellDirective } from '../../../../shared/components/data-table/data-table-cell.directive';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { DataTableColumn, DataTableRow } from '../../../../shared/components/data-table/data-table.interface';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { ProgressBarComponent } from '../../../../shared/components/progress-bar/progress-bar.component';
import { SelectFieldComponent } from '../../../../shared/components/select-field/select-field.component';
import { GeneratedDocument, documentTypeLabel } from '../../../document-history/models/generated-document.model';
import { DocumentHistoryService } from '../../../document-history/services/document-history.service';
import {
  PERIOD_OPTIONS,
  axisChartOptions,
  missionStatusSlices,
  monthLabel,
  shareOf
} from '../../../statistics/models/statistics-charts';
import { MissionProgress, Statistics } from '../../../statistics/models/statistics.model';
import { StatisticsService } from '../../../statistics/services/statistics.service';
import { KeyFigureComponent } from '../../components/key-figure/key-figure.component';

interface DashboardData {
  statistics: Statistics;
  progress: MissionProgress[];
}

type DashboardLoadResult = DashboardData | { error: string };

// Number of type colors of the badges (.dashboard-type-0 to -4).
const TYPE_COLORS = 5;
// Missions shown in the progress list.
const PROGRESS_LIMIT = 5;

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    ChartComponent,
    DataTableCellDirective,
    DataTableComponent,
    EmptyStateComponent,
    IconButtonComponent,
    LoadingComponent,
    PageHeaderComponent,
    ProgressBarComponent,
    KeyFigureComponent,
    SelectFieldComponent
  ],
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss'
})
export class DashboardComponent {
  private readonly statisticsService = inject(StatisticsService);
  private readonly documentHistoryService = inject(DocumentHistoryService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);

  readonly data = signal<DashboardData | null>(null);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  private readonly reloadCount = signal<number>(0);

  readonly periodOptions = PERIOD_OPTIONS;
  readonly period = signal<string>('6');
  readonly downloadingId = signal<number | null>(null);

  readonly statistics = computed(() => this.data()?.statistics ?? null);

  readonly documentColumns: DataTableColumn[] = [
    { key: 'nomFichier', label: 'Nom du document' },
    { key: 'type', label: 'Type' },
    { key: 'mission', label: 'Mission' },
    { key: 'dateGeneration', label: 'Date de génération' },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  readonly documentRows = computed<DataTableRow[]>(() =>
    (this.statistics()?.derniersDocuments ?? []).map((document) => ({
      id: document.id,
      nomFichier: document.nomFichier,
      type: documentTypeLabel(document),
      mission: document.missionIntitule ?? '—',
      dateGeneration: formatDate(document.dateGeneration, 'dd/MM/yyyy HH:mm', 'en-US')
    }))
  );

  // Last months of the chosen period.
  readonly months = computed(() => (this.statistics()?.documentsParMois ?? []).slice(-Number(this.period())));
  readonly periodTotal = computed(() => this.months().reduce((total, month) => total + month.nombre, 0));

  readonly documentsChart = computed<ChartConfiguration<'bar'>>(() => ({
    type: 'bar',
    data: {
      labels: this.months().map((month) => monthLabel(month.mois)),
      datasets: [
        {
          label: 'Documents générés',
          data: this.months().map((month) => month.nombre),
          backgroundColor: CHART_COLORS.turquoise,
          hoverBackgroundColor: CHART_COLORS.primary,
          borderRadius: 6,
          maxBarThickness: 48
        }
      ]
    },
    options: axisChartOptions(),
    plugins: [BAR_VALUE_LABELS]
  }));

  readonly missionSlices = computed(() => {
    const statistics = this.statistics();
    return statistics ? missionStatusSlices(statistics) : [];
  });

  readonly missionTotal = computed(() => this.statistics()?.nombreMissions ?? 0);

  readonly missionsChart = computed<ChartConfiguration<'doughnut'>>(() => ({
    type: 'doughnut',
    data: {
      labels: this.missionSlices().map((slice) => slice.label),
      datasets: [
        {
          data: this.missionSlices().map((slice) => slice.count),
          backgroundColor: this.missionSlices().map((slice) => slice.color),
          borderColor: CHART_COLORS.white,
          borderWidth: 3,
          hoverOffset: 6
        }
      ]
    },
    options: {
      maintainAspectRatio: false,
      cutout: '72%',
      plugins: {
        legend: { display: false },
        tooltip: { backgroundColor: CHART_COLORS.primary, padding: 10, cornerRadius: 8 }
      }
    }
  }));

  // Missions still being filled in first, then the most advanced ones.
  readonly progressList = computed(() =>
    [...(this.data()?.progress ?? [])]
      .sort((first, second) => {
        const firstDone = first.pourcentage >= 100 ? 1 : 0;
        const secondDone = second.pourcentage >= 100 ? 1 : 0;
        return firstDone - secondDone || second.pourcentage - first.pourcentage;
      })
      .slice(0, PROGRESS_LIMIT)
  );

  constructor() {
    toObservable(this.reloadCount)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.errorMessage.set(null);
        }),
        switchMap(() =>
          forkJoin({
            statistics: this.statisticsService.getStatistics(),
            progress: this.statisticsService.getMissionProgress()
          }).pipe(
            catchError((error: unknown) => from(readApiErrorMessage(error)).pipe(map((message) => ({ error: message }))))
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((result: DashboardLoadResult) => {
        if ('error' in result) {
          this.errorMessage.set(result.error);
        } else {
          this.data.set(result);
        }

        this.loading.set(false);
      });
  }

  reload(): void {
    this.reloadCount.update((count) => count + 1);
  }

  // 42.86 → 43.
  rounded(percent: number): number {
    return Math.round(percent);
  }

  share(count: number): string {
    return shareOf(count, this.missionTotal());
  }

  findDocument(row: DataTableRow): GeneratedDocument | null {
    return this.statistics()?.derniersDocuments.find((document) => document.id === row['id']) ?? null;
  }

  readonly typeLabel = documentTypeLabel;

  // The same type always gets the same color; a deleted type is grey.
  typeColor(document: GeneratedDocument): string {
    return document.documentTypeId === null ? 'dashboard-type-deleted' : `dashboard-type-${document.documentTypeId % TYPE_COLORS}`;
  }

  downloadDocument(document: GeneratedDocument): void {
    this.downloadingId.set(document.id);

    this.documentHistoryService.saveCopy(document.id).subscribe({
      next: () => this.downloadingId.set(null),
      error: async (error: unknown) => {
        this.downloadingId.set(null);
        this.toastService.error(await readApiErrorMessage(error));
      }
    });
  }

  openDocument(document: GeneratedDocument): void {
    this.router.navigate(['/document-history', document.id]);
  }

  openMission(progress: MissionProgress): void {
    this.router.navigate(['/missions', progress.missionId]);
  }

  openHistory(): void {
    this.router.navigate(['/document-history']);
  }

  openMissions(): void {
    this.router.navigate(['/missions']);
  }

  createMission(): void {
    this.router.navigate(['/missions'], { queryParams: { nouvelle: 1 } });
  }

  generateDocument(): void {
    this.router.navigate(['/documents']);
  }
}
