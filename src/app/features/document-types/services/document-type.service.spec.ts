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

  it('should create, update, change the status of and delete a document type', () => {
    const request = { code: 'FICHE', nom: 'Fiche', description: null };

    service.create(request).subscribe();
    const create = httpTesting.expectOne(`${API_BASE_URL}/document-types`);
    expect(create.request.method).toBe('POST');
    expect(create.request.body).toEqual(request);
    create.flush({});

    service.update(3, request).subscribe();
    const update = httpTesting.expectOne(`${API_BASE_URL}/document-types/3`);
    expect(update.request.method).toBe('PUT');
    update.flush({});

    service.changeStatus(3, false).subscribe();
    const status = httpTesting.expectOne(`${API_BASE_URL}/document-types/3/statut`);
    expect(status.request.method).toBe('PATCH');
    expect(status.request.body).toEqual({ actif: false });
    status.flush({});

    service.delete(3).subscribe();
    const remove = httpTesting.expectOne(`${API_BASE_URL}/document-types/3`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);
  });

  it('should load the form of a document type', () => {
    service.getForm(7).subscribe();

    const request = httpTesting.expectOne(`${API_BASE_URL}/document-types/7/form`);
    expect(request.request.method).toBe('GET');
    request.flush({ documentType: null, template: null, fields: [] });
  });

  it('should upload a template as multipart and validate its variables', () => {
    const file = new File(['content'], 'fiche.docx');

    service.uploadTemplate(7, file).subscribe();
    const upload = httpTesting.expectOne(`${API_BASE_URL}/document-types/7/template`);
    expect(upload.request.method).toBe('POST');
    expect((upload.request.body as FormData).get('file')).toBe(file);
    upload.flush({});

    service.validateTemplate(7).subscribe();
    const validation = httpTesting.expectOne(`${API_BASE_URL}/document-types/7/template/validate-variables`);
    expect(validation.request.method).toBe('GET');
    validation.flush({});
  });
});
