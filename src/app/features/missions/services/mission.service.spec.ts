import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/http/api.config';
import { MissionService } from './mission.service';

describe('MissionService', () => {
  let service: MissionService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(MissionService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should load all missions', () => {
    service.getAll().subscribe();

    const request = httpTesting.expectOne(`${API_BASE_URL}/missions`);
    expect(request.request.method).toBe('GET');
    request.flush([]);
  });
});
