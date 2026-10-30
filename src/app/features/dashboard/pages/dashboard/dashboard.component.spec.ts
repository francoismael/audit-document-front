import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { TEST_PROGRESS, TEST_STATISTICS } from '../../../statistics/testing/statistics-test-data';
import { DashboardComponent } from './dashboard.component';

describe('DashboardComponent', () => {
  let component: DashboardComponent;
  let fixture: ComponentFixture<DashboardComponent>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;

  const text = (): string => element.textContent?.replace(/\s+/g, ' ') ?? '';

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DashboardComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(DashboardComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpTesting.expectOne(`${API_BASE_URL}/statistiques`).flush(TEST_STATISTICS);
    httpTesting.expectOne(`${API_BASE_URL}/statistiques/avancement`).flush(TEST_PROGRESS);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should show the last generated documents, then the four blocks with the key figures', () => {
    const figures = Array.from(element.querySelectorAll('.key-figure-value')).map((value) =>
      value.textContent?.replace(/\s+/g, '')
    );

    expect(element.querySelector('app-stat-tile')).toBeNull();
    expect(element.querySelectorAll('.dashboard-grid > app-card').length).toBe(4);
    // En cours, terminées, documents of the 6 months, active types.
    expect(figures).toEqual(['3/8', '2/8', '3/4', '2/3']);
    expect(text()).toContain('note-de-service.pdf');
    expect(element.querySelectorAll('.dashboard-type').length).toBe(3);
    // The same type keeps the same color.
    expect(element.querySelectorAll('.dashboard-type')[0].classList).toContain('dashboard-type-1');
  });

  it('should chart the documents of the chosen period', () => {
    expect(component.documentsChart().data.labels?.length).toBe(6);
    expect(component.periodTotal()).toBe(3);

    component.period.set('12');
    expect(component.documentsChart().data.labels?.length).toBe(12);
    expect(component.periodTotal()).toBe(4);
  });

  it('should show the missions by state with their share and the total in the donut', () => {
    const legend = Array.from(element.querySelectorAll('.dashboard-legend li')).map((item) =>
      Array.from(item.querySelectorAll('span'))
        .map((span) => span.textContent?.trim())
        .filter((value) => value)
        .join(' ')
    );

    expect(element.querySelector('.dashboard-donut-total strong')?.textContent).toBe('8');
    expect(legend).toEqual(['Terminées 25 % (2)', 'En cours 38 % (3)', 'À venir 25 % (2)', 'Sans dates 13 % (1)']);
  });

  it('should list the missions still being filled in first', () => {
    const missions = Array.from(element.querySelectorAll('.dashboard-progress-numero')).map((numero) => numero.textContent);

    expect(missions).toEqual(['N° 005', 'N° 007', 'N° 006']);
  });

  it('should open the mission form from "Nouvelle mission"', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    component.createMission();

    expect(navigate).toHaveBeenCalledWith(['/missions'], { queryParams: { nouvelle: 1 } });
  });
});
