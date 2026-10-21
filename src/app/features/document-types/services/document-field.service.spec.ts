import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/http/api.config';
import { DocumentFieldRequest } from '../models/document-field.model';
import { DocumentFieldService } from './document-field.service';

describe('DocumentFieldService', () => {
  let service: DocumentFieldService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(DocumentFieldService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should create, update and delete a field', () => {
    const request: DocumentFieldRequest = {
      documentTypeId: 3,
      nom: 'date_debut',
      libelle: 'Date de début',
      type: 'DATE',
      obligatoire: true
    };

    service.create(request).subscribe();
    const create = httpTesting.expectOne(`${API_BASE_URL}/document-fields`);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(request);
    create.flush({});

    service.update(8, request).subscribe();
    const update = httpTesting.expectOne(`${API_BASE_URL}/document-fields/8`);
    expect(update.request.method).toBe('PUT');
    update.flush({});

    service.delete(8).subscribe();
    const remove = httpTesting.expectOne(`${API_BASE_URL}/document-fields/8`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);
  });
});
