import { HttpHeaders, provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/http/api.config';
import { GeneratedFile } from '../models/generated-file.model';
import { DocumentGenerationService } from './document-generation.service';

describe('DocumentGenerationService', () => {
  let service: DocumentGenerationService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(DocumentGenerationService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should send the values with the mission and read the generated PDF', () => {
    const pdf = new Blob(['%PDF-'], { type: 'application/pdf' });
    let result: GeneratedFile | undefined;

    service.generate(6, { motifs: 'Contrôle' }, 10).subscribe((file) => (result = file));

    const request = httpTesting.expectOne(`${API_BASE_URL}/document-types/6/generate?missionId=10`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body).toEqual({ motifs: 'Contrôle' });
    expect(request.request.responseType).toBe('blob');

    request.flush(pdf, {
      headers: new HttpHeaders({
        'Content-Disposition': 'attachment; filename*=UTF-8\'\'FICHE_SUIVI_20261020.pdf',
        'X-Document-Id': '42'
      })
    });

    expect(result).toEqual({ fileName: 'FICHE_SUIVI_20261020.pdf', documentId: 42, content: pdf });
  });

  it('should not send a mission when none is chosen', () => {
    service.generate(6, {}, null).subscribe();

    httpTesting.expectOne(`${API_BASE_URL}/document-types/6/generate`).flush(new Blob());
  });
});
