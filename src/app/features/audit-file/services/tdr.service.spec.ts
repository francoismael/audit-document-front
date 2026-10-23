import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/http/api.config';
import { DeclarationIndependanceService } from './declaration-independance.service';
import { ReunionService } from './reunion.service';
import { TdrService } from './tdr.service';

// The three services of the first business documents: same shape, one spec.
describe('Business document services', () => {
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should find the TDR of a mission and save it', () => {
    const service = TestBed.inject(TdrService);
    let found: number | null | undefined;

    service.getByMission(10).subscribe((tdr) => (found = tdr?.id ?? null));
    httpTesting.expectOne(`${API_BASE_URL}/tdrs`).flush([{ id: 1, missionId: 9 }, { id: 2, missionId: 10 }]);
    expect(found).toBe(2);

    service
      .update(2, {
        missionId: 10,
        contexte: null,
        competence: null,
        perimetre: null,
        periodeObservation: null,
        lieu: null,
        methodologieTravail: null,
        resultatsAttendus: null,
        livrables: null,
        dateTdr: '2026-10-28',
        objectifs: [{ id: null, descriptions: 'S’assurer de la fiabilité des comptes.' }]
      })
      .subscribe();
    expect(httpTesting.expectOne(`${API_BASE_URL}/tdrs/2`).request.method).toBe('PUT');
  });

  it('should keep only the declarations of the mission', () => {
    const service = TestBed.inject(DeclarationIndependanceService);
    let count = 0;

    service.getByMission(10).subscribe((declarations) => (count = declarations.length));
    httpTesting
      .expectOne(`${API_BASE_URL}/declarations-independance`)
      .flush([{ id: 1, missionId: 10 }, { id: 2, missionId: 11 }, { id: 3, missionId: 10 }]);

    expect(count).toBe(2);
  });

  it('should find the opening meeting of the mission', () => {
    const service = TestBed.inject(ReunionService);
    let found: number | null | undefined;

    service.getByMission(10, 'OUVERTURE').subscribe((reunion) => (found = reunion?.id ?? null));
    httpTesting.expectOne(`${API_BASE_URL}/reunions`).flush([
      { id: 1, missionId: 10, type: 'CLOTURE' },
      { id: 2, missionId: 10, type: 'OUVERTURE' }
    ]);

    expect(found).toBe(2);

    service.delete(2).subscribe();
    expect(httpTesting.expectOne(`${API_BASE_URL}/reunions/2`).request.method).toBe('DELETE');
  });
});
