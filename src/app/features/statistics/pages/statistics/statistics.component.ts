import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { ChartConfiguration, ChartDataset } from 'chart.js';
import { catchError, forkJoin, from, map, switchMap, tap } from 'rxjs';

import { readApiErrorMessage } from '../../../../core/http/api-error';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { CHART_COLORS, CHART_SERIES_COLORS, withOpacity } from '../../../../shared/components/chart/chart-palette';
import { ChartComponent } from '../../../../shared/components/chart/chart.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SelectFieldComponent } from '../../../../shared/components/select-field/select-field.component';
import { GeneratedDocument } from '../../../document-history/models/generated-document.model';
import { DocumentHistoryService } from '../../../document-history/services/document-history.service';
import { Mission } from '../../../missions/models/mission.model';
import { MissionService } from '../../../missions/services/mission.service';
import {
  PERIOD_OPTIONS,
  axisChartOptions,
  countByMonth,
  lastMonths,
  monthLabel,
  runningTotal
} from '../../models/statistics-charts';
import { MissionProgress } from '../../models/statistics.model';
import { StatisticsService } from '../../services/statistics.service';

interface StatisticsData {
  documents: GeneratedDocument[];
  missions: Mission[];
  progress: MissionProgress[];
}

type StatisticsLoadResult = StatisticsData | { error: string };

// Types drawn as their own curve; the others are grouped in "Autres types".
const TYPE_CURVES = 5;

// The 7 documents of GET /statistiques/avancement, in the order of an audit. Long names on two lines.
const PROGRESS_DOCUMENTS: { key: keyof MissionProgress; label: string | string[] }[] = [
  { key: 'tdr', label: 'TDR' },
  { key: 'programme', label: 'Programme' },
  { key: 'tests', label: 'Tests' },
  { key: 'constats', label: 'Constats' },
  { key: 'pvAffirmation', label: ['PV', "d'affirmation"] },
  { key: 'rapport', label: 'Rapport' },
  { key: 'pvCloture', label: ['PV de', 'clôture'] }
];

@Component({
  selector: 'app-statistics',
  standalone: true,
  imports: [
    CardComponent,
    ChartComponent,
    EmptyStateComponent,
    LoadingComponent,
    PageHeaderComponent,
    SelectFieldComponent
  ],
  templateUrl: './statistics.component.html',
  styleUrl: './statistics.component.scss'
})
export class StatisticsComponent {
  private readonly statisticsService = inject(StatisticsService);
  private readonly documentHistoryService = inject(DocumentHistoryService);
  private readonly missionService = inject(MissionService);

  readonly data = signal<StatisticsData | null>(null);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  private readonly reloadCount = signal<number>(0);

  readonly periodOptions = PERIOD_OPTIONS;
  readonly period = signal<string>('12');

  readonly months = computed(() => lastMonths(Number(this.period()), new Date()));
  readonly monthLabels = computed(() => this.months().map(monthLabel));

  private readonly documents = computed(() => this.data()?.documents ?? []);

  readonly documentsPerMonth = computed(() =>
    countByMonth(
      this.documents().map((document) => document.dateGeneration),
      this.months()
    )
  );

  readonly missionsPerMonth = computed(() =>
    countByMonth(
      (this.data()?.missions ?? []).flatMap((mission) => (mission.dateDebut ? [mission.dateDebut] : [])),
      this.months()
    )
  );

  // One smooth curve per document type (the most used ones), over the period.
  readonly documentsByTypeChart = computed<ChartConfiguration<'line'>>(() => {
    const byType = new Map<string, string[]>();

    for (const document of this.documents()) {
      byType.set(document.documentTypeNom, [...(byType.get(document.documentTypeNom) ?? []), document.dateGeneration]);
    }

    const types = [...byType.entries()].sort((first, second) => second[1].length - first[1].length);
    const shown = types.slice(0, TYPE_CURVES);
    const others = types.slice(TYPE_CURVES).flatMap(([, dates]) => dates);

    const series = shown.map(([label, dates]) => ({ label, data: countByMonth(dates, this.months()) }));

    if (others.length > 0) {
      series.push({ label: 'Autres types', data: countByMonth(others, this.months()) });
    }

    return {
      type: 'line',
      data: {
        labels: this.monthLabels(),
        datasets: series.map((serie, index) => curve(serie.label, serie.data, CHART_SERIES_COLORS[index % CHART_SERIES_COLORS.length], false))
      },
      options: withLegend(axisChartOptions())
    };
  });

  // Documents generated since the beginning, month after month.
  readonly cumulativeChart = computed<ChartConfiguration<'line'>>(() => {
    const firstMonth = this.months()[0];
    const before = this.documents().filter((document) => document.dateGeneration.slice(0, 7) < firstMonth).length;

    return {
      type: 'line',
      data: {
        labels: this.monthLabels(),
        datasets: [curve('Documents générés (cumul)', runningTotal(this.documentsPerMonth(), before), CHART_COLORS.primary, true)]
      },
      options: axisChartOptions()
    };
  });

  readonly missionsChart = computed<ChartConfiguration<'line'>>(() => ({
    type: 'line',
    data: {
      labels: this.monthLabels(),
      datasets: [curve('Missions commencées', this.missionsPerMonth(), CHART_COLORS.gold, true)]
    },
    options: axisChartOptions()
  }));

  // Share of the missions that have each document of the audit file.
  readonly fillingChart = computed<ChartConfiguration<'line'>>(() => {
    const progress = this.data()?.progress ?? [];
    const options = axisChartOptions();

    return {
      type: 'line',
      data: {
        labels: PROGRESS_DOCUMENTS.map((document) => document.label),
        datasets: [
          curve(
            'Missions avec ce document (%)',
            PROGRESS_DOCUMENTS.map((document) =>
              progress.length > 0
                ? Math.round((progress.filter((mission) => mission[document.key] === true).length * 100) / progress.length)
                : 0
            ),
            CHART_COLORS.green,
            true
          )
        ]
      },
      options: {
        ...options,
        scales: {
          ...options.scales,
          x: { ...options.scales?.['x'], ticks: { maxRotation: 0, autoSkip: false } },
          y: { ...options.scales?.['y'], max: 100, grace: 0 }
        }
      }
    };
  });

  constructor() {
    toObservable(this.reloadCount)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.errorMessage.set(null);
        }),
        switchMap(() =>
          forkJoin({
            documents: this.documentHistoryService.getAll({ documentTypeId: null, missionId: null }),
            missions: this.missionService.getAll(),
            progress: this.statisticsService.getMissionProgress()
          }).pipe(
            catchError((error: unknown) => from(readApiErrorMessage(error)).pipe(map((message) => ({ error: message }))))
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((result: StatisticsLoadResult) => {
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
}

// A smooth curve; `filled` colors the area under it.
function curve(label: string, data: number[], color: string, filled: boolean): ChartDataset<'line'> {
  return {
    label,
    data,
    borderColor: color,
    backgroundColor: withOpacity(color, filled ? 0.15 : 0.08),
    fill: filled ? 'origin' : false,
    tension: 0.4,
    // Smooth without going beyond the points (no dip below a value).
    cubicInterpolationMode: 'monotone',
    borderWidth: 2.5,
    pointRadius: 3,
    pointHoverRadius: 6,
    pointBackgroundColor: CHART_COLORS.white,
    pointBorderColor: color,
    pointBorderWidth: 2
  };
}

// Several curves: the legend says which is which.
function withLegend(options: ChartConfiguration<'line'>['options']): ChartConfiguration<'line'>['options'] {
  return {
    ...options,
    plugins: {
      ...options?.plugins,
      legend: {
        display: true,
        position: 'bottom',
        labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 8, boxHeight: 8, padding: 16 }
      }
    }
  };
}
