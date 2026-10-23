import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/http/api.config';
import { PersonneService } from './personne.service';

describe('PersonneService', () => {
  let service: PersonneService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(PersonneService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should load and create', () => {
    service.getAll().subscribe();
    httpTesting.expectOne(`${API_BASE_URL}/personnes`).flush([]);

    service.create({ nom: 'Rakoto', prenom: 'Jean', matricule: null, fonction: null, services: null }).subscribe();
    const create = httpTesting.expectOne(`${API_BASE_URL}/personnes`);
    expect(create.request.method).toBe('POST');
    create.flush({});
  });
});
