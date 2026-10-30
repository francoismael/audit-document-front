import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { TEST_MISSION } from '../../../audit-file/testing/audit-file-test-data';
import { TEST_DOCUMENTS, TEST_PROGRESS } from '../../testing/statistics-test-data';
import { StatisticsComponent } from './statistics.component';

describe('StatisticsComponent', () => {
  let component: StatisticsComponent;
  let fixture: ComponentFixture<StatisticsComponent>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    // The months of the charts are counted from today.
    jasmine.clock().install();
    jasmine.clock().mockDate(new Date(2026, 9, 28));

    await TestBed.configureTestingModule({
      imports: [StatisticsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(StatisticsComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpTesting.expectOne(`${API_BASE_URL}/documents-generes`).flush(TEST_DOCUMENTS);
    httpTesting.expectOne(`${API_BASE_URL}/missions`).flush([
      TEST_MISSION,
      { ...TEST_MISSION, id: 11, dateDebut: '2026-10-05' },
      { ...TEST_MISSION, id: 12, dateDebut: null }
    ]);
    httpTesting.expectOne(`${API_BASE_URL}/statistiques/avancement`).flush(TEST_PROGRESS);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
    jasmine.clock().uninstall();
  });

  it('should show the four charts at once, without key figure tiles', () => {
    expect(element.querySelectorAll('.statistics-grid app-chart').length).toBe(4);
    expect(element.querySelector('app-stat-tile')).toBeNull();
  });

  it('should count the documents and the missions of the chosen period', () => {
    // One mission began in October; the other one begins in November, after the period.
    expect(component.missionsChart().data.datasets[0].data.slice(-2)).toEqual([0, 1]);
    expect(component.months().length).toBe(12);

    component.period.set('3');
    expect(component.monthLabels()).toEqual(['Août', 'Sept.', 'Oct.']);
    expect(component.documentsPerMonth()).toEqual([0, 1, 2]);
  });

  it('should draw one smooth curve per document type', () => {
    const datasets = component.documentsByTypeChart().data.datasets;

    expect(datasets.map((dataset) => dataset.label)).toEqual(['Note de service', 'Lettre']);
    expect(datasets[0].data.slice(-2)).toEqual([0, 2]);
    expect(datasets[0].tension).toBe(0.4);
  });

  it('should add up the documents, counting those before the period', () => {
    component.period.set('3');

    // One document in December 2025, before August 2026.
    expect(component.cumulativeChart().data.datasets[0].data).toEqual([1, 2, 4]);
  });

  it('should give the share of the missions that have each document', () => {
    // TDR: 3 of 3; programme: 2 of 3; constats: 1 of 3.
    expect(component.fillingChart().data.datasets[0].data).toEqual([100, 67, 67, 33, 33, 33, 33]);
  });
});
