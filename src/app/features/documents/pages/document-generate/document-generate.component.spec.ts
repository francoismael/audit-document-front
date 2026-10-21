import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { DocumentTypeForm } from '../../../document-types/models/document-type.model';
import { Mission } from '../../../missions/models/mission.model';
import { DocumentGenerateComponent } from './document-generate.component';

const FORM: DocumentTypeForm = {
  documentType: {
    id: 1,
    code: 'FICHE_SUIVI',
    nom: 'Fiche de suivi',
    description: 'Suivi des recommandations.',
    actif: true,
    dateCreation: '2026-10-07T08:06:13'
  },
  template: {
    id: 1,
    documentTypeId: 1,
    documentTypeNom: 'Fiche de suivi',
    nomFichierOriginal: 'fiche_suivi.docx',
    typeMime: null,
    taille: 13338,
    version: 1,
    actif: true,
    dateUpload: '2026-10-07T08:19:00'
  },
  fields: [
    { id: 3, documentTypeId: 1, documentTypeNom: 'Fiche de suivi', nom: 'dateEmission', libelle: 'Date d\'émission', type: 'DATE', obligatoire: true, ordre: 2 },
    { id: 1, documentTypeId: 1, documentTypeNom: 'Fiche de suivi', nom: 'motifs', libelle: 'Motifs', type: 'TEXTAREA', obligatoire: false, ordre: 1 },
    { id: 4, documentTypeId: 1, documentTypeNom: 'Fiche de suivi', nom: 'urgent', libelle: 'Urgent', type: 'BOOLEAN', obligatoire: false, ordre: 3 }
  ]
};

const MISSIONS: Mission[] = [
  {
    id: 10,
    numero: '001',
    intitule: 'Audit de la gestion financière',
    objet: null,
    dateDebut: null,
    dateFin: null,
    dateSignature: null,
    structureId: null,
    structureNom: null,
    personnes: []
  }
];

async function waitUntil(condition: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();

  while (!condition()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Condition not met in time');
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

describe('DocumentGenerateComponent', () => {
  let fixture: ComponentFixture<DocumentGenerateComponent>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentGenerateComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentGenerateComponent);
    httpTesting = TestBed.inject(HttpTestingController);
    element = fixture.nativeElement;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  const open = (documentTypeId: string): void => {
    fixture.componentRef.setInput('documentTypeId', documentTypeId);
    fixture.detectChanges();
    httpTesting.expectOne(`${API_BASE_URL}/missions`).flush(MISSIONS);
  };

  const respondWithForm = (form: DocumentTypeForm): void => {
    httpTesting.expectOne(`${API_BASE_URL}/document-types/${form.documentType.id}/form`).flush(form);
    fixture.detectChanges();
  };

  const fieldLabels = (): string[] =>
    Array.from(element.querySelectorAll('.dynamic-form-fields label')).map(
      (label) => label.textContent?.replace('*', '').trim() ?? ''
    );

  it('should show the configured fields in their order, each with the right component', () => {
    open('1');
    respondWithForm(FORM);

    expect(fieldLabels()).toEqual(['Motifs', 'Date d\'émission', 'Urgent']);
    expect(element.querySelector('app-textarea-field')).not.toBeNull();
    expect(element.querySelector('input[type="date"]')).not.toBeNull();
    expect(element.querySelector('app-checkbox-field')).not.toBeNull();
    expect(element.textContent).not.toContain('Nature');
  });

  it('should offer the missions as an optional choice', () => {
    open('1');
    respondWithForm(FORM);

    const options = Array.from(element.querySelectorAll('#document-generate-mission option')).map(
      (option) => option.textContent?.trim()
    );

    expect(options).toEqual(['Aucune mission', '001 — Audit de la gestion financière']);
  });

  it('should keep the typed values when going back from the preview', () => {
    open('1');
    respondWithForm(FORM);
    const component = fixture.componentInstance;

    component.missionId.set('10');
    component.onReview({ motifs: 'Contrôle annuel', dateEmission: '2026-10-20', urgent: true });
    fixture.detectChanges();
    expect(element.textContent).toContain('Récapitulatif des informations');

    component.onEdit();
    fixture.detectChanges();

    expect(element.querySelector<HTMLTextAreaElement>('#dynamic-field-motifs')?.value).toBe('Contrôle annuel');
    expect(element.querySelector<HTMLInputElement>('#dynamic-field-dateEmission')?.value).toBe('2026-10-20');
    expect(element.querySelector<HTMLSelectElement>('select#document-generate-mission')?.value).toBe('10');
  });

  it('should summarize the values and the chosen mission before generating', () => {
    open('1');
    respondWithForm(FORM);
    const component = fixture.componentInstance;

    component.missionId.set('10');
    component.onReview({ motifs: 'Contrôle annuel', dateEmission: '2026-10-20', urgent: false });
    fixture.detectChanges();

    const rows = Array.from(element.querySelectorAll('.document-preview-row')).map((row) => [
      row.querySelector('dt')?.textContent?.trim(),
      row.querySelector('dd')?.textContent?.trim()
    ]);

    expect(rows).toEqual([
      ['Mission associée', '001 — Audit de la gestion financière'],
      ['Motifs', 'Contrôle annuel'],
      ['Date d\'émission', '20/10/2026'],
      ['Urgent', 'Non']
    ]);
    expect(element.textContent).toContain('Générer le document');
    expect(element.textContent).toContain('n\'est pas un aperçu du document PDF final');
  });

  it('should say when no mission is linked', () => {
    open('1');
    respondWithForm(FORM);

    expect(fixture.componentInstance.summaryRows()).toEqual([{ label: 'Mission associée', value: 'Aucune' }]);
  });

  it('should generate the PDF and show the success screen', () => {
    open('1');
    respondWithForm(FORM);
    const component = fixture.componentInstance;

    component.missionId.set('10');
    component.onReview({ motifs: 'Contrôle annuel', dateEmission: '2026-10-20', urgent: false });
    component.onConfirmGeneration();
    fixture.detectChanges();

    expect(element.textContent).toContain('Génération du PDF en cours');
    const summaryButtons = Array.from(element.querySelectorAll<HTMLButtonElement>('app-document-preview button'));
    expect(summaryButtons.every((button) => button.disabled)).toBeTrue();

    const request = httpTesting.expectOne(`${API_BASE_URL}/document-types/1/generate?missionId=10`);
    expect(request.request.body).toEqual({ motifs: 'Contrôle annuel', dateEmission: '2026-10-20', urgent: false });
    request.flush(new Blob(['%PDF-'], { type: 'application/pdf' }), {
      headers: { 'Content-Disposition': 'attachment; filename*=UTF-8\'\'FICHE_SUIVI_20261020.pdf', 'X-Document-Id': '5' }
    });
    fixture.detectChanges();

    expect(element.textContent).toContain('Document généré');
    expect(element.textContent).toContain('FICHE_SUIVI_20261020.pdf');
    expect(element.textContent).toContain('Ouvrir le PDF');
    expect(element.textContent).toContain('Voir dans l\'historique');
  });

  it('should stay on the summary with the values when the generation fails', async () => {
    open('1');
    respondWithForm(FORM);
    const component = fixture.componentInstance;

    component.onReview({ motifs: '', dateEmission: '2026-10-20', urgent: false });
    component.onConfirmGeneration();

    const error = new Blob([JSON.stringify({ status: 400, message: 'Le champ « Motifs » est obligatoire' })], {
      type: 'application/json'
    });
    httpTesting
      .expectOne(`${API_BASE_URL}/document-types/1/generate`)
      .flush(error, { status: 400, statusText: 'Bad Request' });

    // Reading the error message from the Blob is a native browser task that whenStable() does not track.
    await waitUntil(() => !component.generating());
    fixture.detectChanges();

    expect(component.generating()).toBeFalse();
    expect(component.generatedFile()).toBeNull();
    expect(element.textContent).toContain('Récapitulatif des informations');
    expect(component.values()).toEqual({ motifs: '', dateEmission: '2026-10-20', urgent: false });
  });

  it('should start a new document from the success screen', () => {
    open('1');
    respondWithForm(FORM);
    const component = fixture.componentInstance;

    component.onReview({ motifs: 'Contrôle annuel', dateEmission: '2026-10-20', urgent: false });
    component.onConfirmGeneration();
    httpTesting.expectOne(`${API_BASE_URL}/document-types/1/generate`).flush(new Blob(['%PDF-']));

    component.createAnotherDocument();
    fixture.detectChanges();

    expect(element.querySelector<HTMLTextAreaElement>('#dynamic-field-motifs')?.value).toBe('');
    expect(element.textContent).not.toContain('Document généré');
  });

  it('should explain when the document type has no Word template', () => {
    open('1');
    respondWithForm({ ...FORM, template: null });

    expect(element.textContent).toContain('Aucun modèle Word');
  });

  it('should explain when the document type has no field', () => {
    open('1');
    respondWithForm({ ...FORM, fields: [] });

    expect(element.textContent).toContain('Aucun champ configuré');
  });

  it('should refuse a disabled document type', () => {
    open('1');
    respondWithForm({ ...FORM, documentType: { ...FORM.documentType, actif: false } });

    expect(element.textContent).toContain('Ce type de document est désactivé');
  });

  it('should refuse an invalid identifier without calling the form API', () => {
    open('abc');
    fixture.detectChanges();

    expect(element.textContent).toContain('Ce type de document est introuvable.');
  });

  it('should show the API message when the document type does not exist', async () => {
    open('99');
    httpTesting
      .expectOne(`${API_BASE_URL}/document-types/99/form`)
      .flush({ status: 404, message: 'Type de document introuvable' }, { status: 404, statusText: 'Not Found' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.textContent).toContain('Type de document introuvable');

    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    fixture.componentInstance.openCatalog();
    expect(navigate).toHaveBeenCalledWith(['/documents']);
  });
});
