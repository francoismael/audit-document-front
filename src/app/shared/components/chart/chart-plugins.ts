import { Plugin } from 'chart.js';

import { CHART_COLORS, CHART_FONT } from './chart-palette';

// Writes the value above each bar (bar charts), as in the dashboard mock-up.
export const BAR_VALUE_LABELS: Plugin<'bar'> = {
  id: 'barValueLabels',
  afterDatasetsDraw(chart) {
    const { ctx } = chart;

    ctx.save();
    ctx.font = `600 12px ${CHART_FONT}`;
    ctx.fillStyle = CHART_COLORS.primary;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'bottom';

    chart.data.datasets.forEach((dataset, datasetIndex) => {
      chart.getDatasetMeta(datasetIndex).data.forEach((bar, index) => {
        const value = dataset.data[index];

        if (typeof value === 'number' && value > 0) {
          ctx.fillText(String(value), bar.x, bar.y - 4);
        }
      });
    });

    ctx.restore();
  }
};
