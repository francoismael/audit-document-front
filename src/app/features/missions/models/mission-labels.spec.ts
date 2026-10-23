import { getMissionStatus } from './mission-labels';

describe('getMissionStatus', () => {
  const today = '2026-10-22';

  it('should follow the rule of the backend statistics', () => {
    expect(getMissionStatus({ dateDebut: '2026-09-01', dateFin: '2026-10-21' }, today)).toBe('finished');
    expect(getMissionStatus({ dateDebut: '2026-11-01', dateFin: '2026-12-01' }, today)).toBe('upcoming');
    expect(getMissionStatus({ dateDebut: '2026-10-01', dateFin: '2026-10-22' }, today)).toBe('ongoing');
    expect(getMissionStatus({ dateDebut: '2026-10-01', dateFin: null }, today)).toBe('ongoing');
    expect(getMissionStatus({ dateDebut: null, dateFin: null }, today)).toBe('undated');
  });
});
