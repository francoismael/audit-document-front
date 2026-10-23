import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/http/api.config';
import { DocumentHistoryService } from './document-history.service';

const URL = `${API_BASE_URL}/documents-generes`;

describe('DocumentHistoryService', () => {
  let service: DocumentHistoryService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });

    service = TestBed.inject(DocumentHistoryService);
    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should only send the filters that are set', () => {
    service.getAll({ documentTypeId: null, missionId: null }).subscribe();
    httpTesting.expectOne(URL).flush([]);

    service.getAll({ documentTypeId: 2, missionId: 10 }).subscribe();
    const filtered = httpTesting.expectOne((request) => request.url === URL);
    expect(filtered.request.params.get('documentTypeId')).toBe('2');
    expect(filtered.request.params.get('missionId')).toBe('10');
    filtered.flush([]);
  });

  it('should load, download and delete one document', () => {
    service.getById(5).subscribe();
    httpTesting.expectOne(`${URL}/5`).flush({});

    let fileName = '';
    service.download(5).subscribe((response) => (fileName = response.headers.get('Content-Disposition') ?? ''));
    const download = httpTesting.expectOne(`${URL}/5/download`);
    expect(download.request.responseType).toBe('blob');
    download.flush(new Blob(['%PDF']), { headers: { 'Content-Disposition': 'attachment; filename="fiche.pdf"' } });
    expect(fileName).toContain('fiche.pdf');

    service.delete(5).subscribe();
    const remove = httpTesting.expectOne(`${URL}/5`);
    expect(remove.request.method).toBe('DELETE');
    remove.flush(null);
  });
});
