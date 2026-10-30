import { countByMonth, lastMonths, missionStatusSlices, monthLabel, runningTotal, shareOf } from './statistics-charts';
import { Statistics } from './statistics.model';

describe('Statistics charts helpers', () => {
  it('should list the last months up to the current one, across years', () => {
    expect(lastMonths(3, new Date(2026, 0, 15))).toEqual(['2025-11', '2025-12', '2026-01']);
  });

  it('should count the dates of each month and add them up', () => {
    const months = ['2026-09', '2026-10'];
    const dates = ['2026-10-02T09:00:00', '2026-09-30', '2026-10-28T17:45:00', '2026-08-01'];

    expect(countByMonth(dates, months)).toEqual([1, 2]);
    expect(runningTotal([1, 0, 2], 5)).toEqual([6, 6, 8]);
  });

  it('should name the months and give the share of a total', () => {
    expect(monthLabel('2026-10')).toBe('Oct.');
    expect(monthLabel('2026-08')).toBe('Août');
    expect(shareOf(82, 128)).toBe('64 %');
    expect(shareOf(3, 0)).toBe('0 %');
  });

  it('should give the missions by state in the order of the legend', () => {
    const slices = missionStatusSlices({
      missionsTerminees: 2,
      missionsEnCours: 4,
      missionsAVenir: 1,
      missionsSansDates: 0
    } as Statistics);

    expect(slices.map((slice) => `${slice.label}:${slice.count}`)).toEqual([
      'Terminées:2',
      'En cours:4',
      'À venir:1',
      'Sans dates:0'
    ]);
  });
});
