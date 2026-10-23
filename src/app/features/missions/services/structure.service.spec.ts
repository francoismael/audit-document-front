import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/http/api.config';
import { StructureService } from './structure.service';

describe('StructureService', () => {
  let service: StructureService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(StructureService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should load and create', () => {
    service.getAll().subscribe();
    httpTesting.expectOne(`${API_BASE_URL}/structures`).flush([]);

    service.create({ nom: 'Direction du Budget', descriptions: null }).subscribe();
    const create = httpTesting.expectOne(`${API_BASE_URL}/structures`);
    expect(create.request.method).toBe('POST');
    create.flush({});
  });
});
