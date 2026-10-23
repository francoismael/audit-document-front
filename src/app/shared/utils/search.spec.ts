import { normalizeForSearch } from './search';

describe('normalizeForSearch', () => {
  it('should remove accents and capitals', () => {
    expect(normalizeForSearch('Procès-verbal de RÉUNION')).toBe('proces-verbal de reunion');
  });
});
