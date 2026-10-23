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

  it('should load, create, update and delete missions', () => {
    const request = {
      intitule: 'Audit des marchés',
      objet: null,
      dateDebut: '2026-11-01',
      dateFin: '2026-11-30',
      dateSignature: null,
      structureId: 3,
      personnes: [{ personneId: 4, roles: 'CHEF_MISSION' as const }]
    };

    service.getAll().subscribe();
    httpTesting.expectOne(`${API_BASE_URL}/missions`).flush([]);

    service.getById(10).subscribe();
    httpTesting.expectOne(`${API_BASE_URL}/missions/10`).flush({});

    service.create(request).subscribe();
    const create = httpTesting.expectOne(`${API_BASE_URL}/missions`);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(request);
    create.flush({});

    service.update(10, request).subscribe();
    const update = httpTesting.expectOne(`${API_BASE_URL}/missions/10`);
    expect(update.request.method).toBe('PUT');
    update.flush({});

    service.delete(10).subscribe();
    const remove = httpTesting.expectOne(`${API_BASE_URL}/missions/10`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);
  });

  it('should load the team of a mission', () => {
    service.getTeam(10).subscribe();
    httpTesting.expectOne(`${API_BASE_URL}/mission-personnes/mission/10`).flush([]);
  });
});
