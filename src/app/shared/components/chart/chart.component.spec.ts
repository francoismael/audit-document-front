import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Chart, ChartConfiguration } from 'chart.js';

import { ChartComponent } from './chart.component';

const config = (values: number[]): ChartConfiguration => ({
  type: 'line',
  data: { labels: ['Mai', 'Juin', 'Juil.'], datasets: [{ label: 'Documents', data: values }] },
  options: { animation: false, maintainAspectRatio: false }
});

describe('ChartComponent', () => {
  let fixture: ComponentFixture<ChartComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChartComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ChartComponent);
    fixture.componentRef.setInput('config', config([1, 2, 3]));
    fixture.componentRef.setInput('label', 'Documents par mois');
    fixture.detectChanges();
  });

  const chartOf = (): Chart | undefined =>
    Chart.getChart((fixture.nativeElement as HTMLElement).querySelector('canvas') as HTMLCanvasElement);

  it('should draw the chart on an accessible canvas', () => {
    const canvas = (fixture.nativeElement as HTMLElement).querySelector('canvas');

    expect(canvas?.getAttribute('aria-label')).toBe('Documents par mois');
    expect(chartOf()?.data.datasets[0].data).toEqual([1, 2, 3]);
  });

  it('should update the same chart with new data, and destroy it with the component', () => {
    const chart = chartOf();

    fixture.componentRef.setInput('config', config([4, 5, 6]));
    fixture.detectChanges();

    expect(chartOf()).toBe(chart);
    expect(chart?.data.datasets[0].data).toEqual([4, 5, 6]);

    fixture.destroy();
    expect(Chart.getChart(chart?.canvas as HTMLCanvasElement)).toBeUndefined();
  });
});
