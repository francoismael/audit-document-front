import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { GeneratedDocument } from '../../models/generated-document.model';
import { DocumentHistoryComponent } from './document-history.component';

const URL = `${API_BASE_URL}/documents-generes`;

const DOCUMENTS: GeneratedDocument[] = [
  {
    id: 7,
    documentTypeId: 1,
    documentTypeCode: 'FICHE_SUIVI',
    documentTypeNom: 'Fiche de suivi',
    missionId: 10,
    missionNumero: 'MIS-2026-001',
    missionIntitule: 'Audit des marchés',
    nomFichier: 'fiche_suivi_20261020.pdf',
    taille: 18_944,
    templateVersion: 1,
    dateGeneration: '2026-10-20T14:30:00',
    valeurs: { motifs: 'Contrôle' }
  },
  {
    id: 6,
    documentTypeId: 2,
    documentTypeCode: 'RAPPORT',
    documentTypeNom: 'Rapport de réunion',
    missionId: null,
    missionNumero: null,
    missionIntitule: null,
    nomFichier: 'rapport.pdf',
    taille: 512,
    templateVersion: 2,
    dateGeneration: '2026-10-19T09:00:00',
    valeurs: {}
  }
];

describe('DocumentHistoryComponent', () => {
  let component: DocumentHistoryComponent;
  let fixture: ComponentFixture<DocumentHistoryComponent>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;

  const rowTexts = (): string[] =>
    Array.from(element.querySelectorAll('tbody tr')).map((row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentHistoryComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentHistoryComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    element = fixture.nativeElement;
    fixture.detectChanges();

    httpTesting.expectOne(`${API_BASE_URL}/document-types`).flush([{ id: 1, nom: 'Fiche de suivi' }]);
    httpTesting.expectOne(`${API_BASE_URL}/missions`).flush([{ id: 10, numero: 'MIS-2026-001', intitule: 'Audit des marchés' }]);
    httpTesting.expectOne(URL).flush(DOCUMENTS);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should list the documents with their type, mission, date and size', () => {
    const rows = rowTexts();

    expect(rows.length).toBe(2);
    expect(rows[0]).toContain('fiche_suivi_20261020.pdf');
    expect(rows[0]).toContain('MIS-2026-001');
    expect(rows[0]).toContain('20/10/2026 14:30');
    expect(rows[0]).toContain('18.5 Ko');
    expect(rows[1]).toContain('—');
    expect(element.textContent).toContain('2 documents');
  });

  it('should search locally without accents and ask the API for the type and mission filters', () => {
    component.search.set('reunion');
    fixture.detectChanges();
    expect(rowTexts().length).toBe(1);
    expect(rowTexts()[0]).toContain('rapport.pdf');

    component.typeFilter.set('1');
    component.missionFilter.set('10');
    fixture.detectChanges();

    const filtered = httpTesting.expectOne((request) => request.url === URL);
    expect(filtered.request.params.get('documentTypeId')).toBe('1');
    expect(filtered.request.params.get('missionId')).toBe('10');
    filtered.flush([]);
    fixture.detectChanges();

    expect(element.textContent).toContain('Aucun document ne correspond');
  });

  it('should open the detail drawer of a document', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    element.querySelector<HTMLButtonElement>('tbody tr button[aria-label="Voir le détail"]')?.click();

    expect(navigate).toHaveBeenCalledWith(['/document-history', 7]);
  });

  it('should download a document with its file name', () => {
    const anchorClick = spyOn(HTMLAnchorElement.prototype, 'click');

    component.downloadDocument(DOCUMENTS[0]);
    expect(component.downloadingId()).toBe(7);

    httpTesting
      .expectOne(`${URL}/7/download`)
      .flush(new Blob(['%PDF']), { headers: { 'Content-Disposition': 'attachment; filename="fiche_suivi_20261020.pdf"' } });

    expect(anchorClick).toHaveBeenCalled();
    expect(component.downloadingId()).toBeNull();
  });

  it('should delete a document after confirmation', () => {
    component.askDelete(DOCUMENTS[1]);
    fixture.detectChanges();
    expect(element.textContent).toContain('Cette action est définitive');

    component.confirmDelete();
    httpTesting.expectOne(`${URL}/6`).flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(rowTexts().length).toBe(1);
    expect(component.documentToDelete()).toBeNull();
  });

  it('should invite to generate a first document when the history is empty', () => {
    component.reloadDocuments();
    fixture.detectChanges();
    httpTesting.expectOne(URL).flush([]);
    fixture.detectChanges();

    expect(element.textContent).toContain('Aucun document généré');
  });
});
