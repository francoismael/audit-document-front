import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { GeneratedDocument } from '../../models/generated-document.model';
import { GeneratedDocumentDetailComponent } from './generated-document-detail.component';

const URL = `${API_BASE_URL}/documents-generes`;

const DOCUMENT: GeneratedDocument = {
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
  valeurs: { motifs: 'Contrôle annuel', urgent: true, ancienChamp: 'Valeur gardée' }
};

const FORM = {
  documentType: { id: 1 },
  template: null,
  fields: [
    { id: 1, nom: 'motifs', libelle: 'Motifs', type: 'TEXTAREA', obligatoire: true, ordre: 1 },
    { id: 2, nom: 'urgent', libelle: 'Urgent', type: 'BOOLEAN', obligatoire: false, ordre: 2 }
  ]
};

describe('GeneratedDocumentDetailComponent', () => {
  let component: GeneratedDocumentDetailComponent;
  let fixture: ComponentFixture<GeneratedDocumentDetailComponent>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;

  const openTab = (label: string): void => {
    Array.from(element.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
      .find((tab) => tab.textContent?.includes(label))
      ?.click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GeneratedDocumentDetailComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(GeneratedDocumentDetailComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    element = fixture.nativeElement;
    fixture.componentRef.setInput('id', '7');
    fixture.detectChanges();

    httpTesting.expectOne(`${URL}/7`).flush(DOCUMENT);
    httpTesting.expectOne(`${API_BASE_URL}/document-types/1/form`).flush(FORM);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should show the information of the document', () => {
    expect(element.querySelector('h2')?.textContent).toContain('fiche_suivi_20261020.pdf');
    expect(element.textContent).toContain('Document généré #7');
    expect(element.textContent).toContain('MIS-2026-001 — Audit des marchés');
    expect(element.textContent).toContain('20/10/2026 à 14:30');
    expect(element.textContent).toContain('18.5 Ko');
    expect(element.textContent).toContain('Télécharger .pdf');
  });

  it('should show the entered values with the labels of the fields, and keep the values of removed fields', () => {
    openTab('Valeurs saisies');

    const text = element.querySelector('app-document-preview')?.textContent ?? '';
    expect(text).toContain('Motifs');
    expect(text).toContain('Contrôle annuel');
    expect(text).toContain('Oui');
    expect(text).toContain('ancienChamp');
    expect(text).toContain('Valeur gardée');
  });

  it('should still show the values when the document type no longer exists', () => {
    fixture.componentRef.setInput('id', '8');
    fixture.detectChanges();

    httpTesting.expectOne(`${URL}/8`).flush({ ...DOCUMENT, id: 8, documentTypeId: 99 });
    httpTesting.expectOne(`${API_BASE_URL}/document-types/99/form`).flush(null, { status: 404, statusText: 'Not Found' });
    fixture.detectChanges();
    openTab('Valeurs saisies');

    expect(element.textContent).toContain('motifs');
    expect(element.textContent).toContain('Contrôle annuel');
  });

  it('should keep the name of a deleted type, without asking for its form', () => {
    fixture.componentRef.setInput('id', '9');
    fixture.detectChanges();

    httpTesting.expectOne(`${URL}/9`).flush({ ...DOCUMENT, id: 9, documentTypeId: null });
    fixture.detectChanges();

    const chips = Array.from(element.querySelectorAll('.detail-chip')).map((chip) => chip.textContent?.trim());
    expect(chips).toContain('Fiche de suivi (type supprimé)');
  });

  it('should delete the document after confirmation, tell the list and close', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    const deleted: number[] = [];
    component.documentDeleted.subscribe((id) => deleted.push(id));

    component.confirmingDeletion.set(true);
    fixture.detectChanges();
    expect(element.textContent).toContain('Supprimer le document');

    component.confirmDeletion();
    httpTesting.expectOne(`${URL}/7`).flush(null, { status: 204, statusText: 'No Content' });

    expect(deleted).toEqual([7]);
    expect(navigate).toHaveBeenCalledWith(['/document-history']);
  });

  it('should show the API message when the document does not exist', async () => {
    fixture.componentRef.setInput('id', '99');
    fixture.detectChanges();

    httpTesting
      .expectOne(`${URL}/99`)
      .flush({ status: 404, message: 'Document généré introuvable' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.textContent).toContain('Document généré introuvable');
  });
});
