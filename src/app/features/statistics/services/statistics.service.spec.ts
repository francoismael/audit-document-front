import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/http/api.config';
import { StatisticsService } from './statistics.service';

describe('StatisticsService', () => {
  let service: StatisticsService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(StatisticsService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should load the statistics and the progress of the missions', () => {
    service.getStatistics().subscribe();
    httpTesting.expectOne(`${API_BASE_URL}/statistiques`).flush({});

    service.getMissionProgress().subscribe();
    httpTesting.expectOne(`${API_BASE_URL}/statistiques/avancement`).flush([]);
  });
});
