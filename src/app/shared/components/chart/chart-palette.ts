// Colors of the charts. Chart.js draws on a canvas and needs the values in TypeScript:
// they are the ones of src/styles/_variables.scss, keep both in step.
export const CHART_COLORS = {
  primary: '#103549',
  turquoise: '#1D8EA6',
  gold: '#F5B940',
  green: '#436758',
  danger: '#D94040',
  muted: '#687780',
  grid: '#E1E7EA',
  white: '#FFFFFF'
};

// One color per series, in this order.
export const CHART_SERIES_COLORS: string[] = [
  CHART_COLORS.turquoise,
  CHART_COLORS.primary,
  CHART_COLORS.gold,
  CHART_COLORS.green,
  CHART_COLORS.danger,
  CHART_COLORS.muted
];

export const CHART_FONT = "'Segoe UI', Roboto, Arial, sans-serif";

// "#1D8EA6" with an opacity, for the filled areas under the curves.
export function withOpacity(hex: string, opacity: number): string {
  const value = parseInt(hex.slice(1), 16);
  return `rgba(${(value >> 16) & 255}, ${(value >> 8) & 255}, ${value & 255}, ${opacity})`;
}
