import { ChartOptions } from 'chart.js';

import { CHART_COLORS } from '../../../shared/components/chart/chart-palette';
import { SelectFieldOption } from '../../../shared/components/select-field/select-field.interface';
import { Statistics } from './statistics.model';

const MONTH_LABELS = ['Janv.', 'Févr.', 'Mars', 'Avr.', 'Mai', 'Juin', 'Juil.', 'Août', 'Sept.', 'Oct.', 'Nov.', 'Déc.'];

// "2026-10" → "Oct.".
export function monthLabel(month: string): string {
  return MONTH_LABELS[Number(month.slice(5, 7)) - 1] ?? month;
}

// The last `count` months up to the month of `today`, as "2026-10", oldest first.
export function lastMonths(count: number, today: Date): string[] {
  return Array.from({ length: count }, (_, index) => {
    const date = new Date(today.getFullYear(), today.getMonth() - (count - 1 - index), 1);
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
  });
}

// How many dates ("2026-10-28..." or "2026-10-28T09:30:00") fall in each month.
export function countByMonth(dates: string[], months: string[]): number[] {
  return months.map((month) => dates.filter((date) => date.startsWith(month)).length);
}

// Running total: [1, 0, 2] → [1, 1, 3], starting from `start`.
export function runningTotal(values: number[], start = 0): number[] {
  let total = start;
  return values.map((value) => (total += value));
}

// The period filter of the charts, in months. The API gives the last 12 months.
export const PERIOD_OPTIONS: SelectFieldOption[] = [
  { value: '3', label: '3 derniers mois' },
  { value: '6', label: '6 derniers mois' },
  { value: '12', label: '12 derniers mois' }
];

export interface MissionStatusSlice {
  label: string;
  count: number;
  color: string;
}

// Missions by state, in the order of the donut and its legend (same rule as the mission list).
export function missionStatusSlices(statistics: Statistics): MissionStatusSlice[] {
  return [
    { label: 'Terminées', count: statistics.missionsTerminees, color: CHART_COLORS.green },
    { label: 'En cours', count: statistics.missionsEnCours, color: CHART_COLORS.turquoise },
    { label: 'À venir', count: statistics.missionsAVenir, color: CHART_COLORS.gold },
    { label: 'Sans dates', count: statistics.missionsSansDates, color: CHART_COLORS.muted }
  ];
}

// "64 %" of the total; 0 % when there is nothing.
export function shareOf(count: number, total: number): string {
  return total > 0 ? `${Math.round((count * 100) / total)} %` : '0 %';
}

// Common look of the axis charts: no legend box, light horizontal grid, whole numbers on the value axis.
export function axisChartOptions(): ChartOptions<'bar'> & ChartOptions<'line'> {
  return {
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: { backgroundColor: CHART_COLORS.primary, padding: 10, cornerRadius: 8 }
    },
    scales: {
      x: { grid: { display: false }, border: { display: false } },
      y: {
        beginAtZero: true,
        grace: '10%',
        ticks: { precision: 0 },
        grid: { color: CHART_COLORS.grid },
        border: { display: false }
      }
    }
  };
}
