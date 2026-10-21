import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/http/api.config';
import { DocumentType } from '../models/document-type.model';
import { DocumentTypeService } from './document-type.service';

describe('DocumentTypeService', () => {
  let service: DocumentTypeService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(DocumentTypeService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should load all document types', () => {
    const documentTypes: DocumentType[] = [
      {
        id: 1,
        code: 'FICHE_SUIVI',
        nom: 'Fiche de suivi',
        description: null,
        actif: true,
        dateCreation: '2026-10-07T08:06:13'
      }
    ];
    let result: DocumentType[] = [];

    service.getAll().subscribe((types) => (result = types));

    const request = httpTesting.expectOne(`${API_BASE_URL}/document-types`);
    expect(request.request.method).toBe('GET');
    request.flush(documentTypes);

    expect(result).toEqual(documentTypes);
  });

  it('should load the form of a document type', () => {
    service.getForm(7).subscribe();

    const request = httpTesting.expectOne(`${API_BASE_URL}/document-types/7/form`);
    expect(request.request.method).toBe('GET');
    request.flush({ documentType: null, template: null, fields: [] });
  });
});
