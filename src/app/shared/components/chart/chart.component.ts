import { Component, DestroyRef, ElementRef, effect, inject, input, viewChild } from '@angular/core';
import { Chart, ChartConfiguration, registerables } from 'chart.js';

import { CHART_COLORS, CHART_FONT } from './chart-palette';

Chart.register(...registerables);
Chart.defaults.font.family = CHART_FONT;
Chart.defaults.color = CHART_COLORS.muted;

// A Chart.js chart. The configuration comes from the page; a new configuration updates the chart in place.
@Component({
  selector: 'app-chart',
  standalone: true,
  templateUrl: './chart.component.html',
  styleUrl: './chart.component.scss'
})
export class ChartComponent {
  readonly config = input.required<ChartConfiguration>();
  // Read by screen readers instead of the drawing.
  readonly label = input.required<string>();

  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('canvas');
  private chart: Chart | null = null;
  private chartType: string | null = null;

  constructor() {
    effect(() => {
      const config = this.config();

      if (this.chart && this.chartType === config.type) {
        this.chart.data = config.data;
        this.chart.options = config.options ?? {};
        this.chart.update();
      } else {
        this.chart?.destroy();
        this.chart = new Chart(this.canvas().nativeElement, config);
        this.chartType = config.type;
      }
    });

    inject(DestroyRef).onDestroy(() => this.chart?.destroy());
  }
}
