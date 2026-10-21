import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { DocumentField } from '../../models/document-field.model';
import { DocumentTemplate, TemplateValidation } from '../../models/document-template.model';
import { DocumentTypeForm } from '../../models/document-type.model';
import { DocumentTypeConfigComponent } from './document-type-config.component';

const FORM_URL = `${API_BASE_URL}/document-types/1/form`;

const FIELDS: DocumentField[] = [
  { id: 10, documentTypeId: 1, documentTypeNom: 'Fiche', nom: 'objet', libelle: 'Objet', type: 'TEXT', obligatoire: true, ordre: 1 },
  { id: 11, documentTypeId: 1, documentTypeNom: 'Fiche', nom: 'date_debut', libelle: 'Date de début', type: 'DATE', obligatoire: false, ordre: 2 }
];

const TEMPLATE: DocumentTemplate = {
  id: 5,
  documentTypeId: 1,
  documentTypeNom: 'Fiche',
  nomFichierOriginal: 'fiche.docx',
  typeMime: null,
  taille: 18_944,
  version: 2,
  actif: true,
  dateUpload: '2026-10-20T14:30:00'
};

const CONFIGURATION: DocumentTypeForm = {
  documentType: { id: 1, code: 'FICHE', nom: 'Fiche de suivi', description: null, actif: true, dateCreation: '2026-10-07T08:06:13' },
  template: TEMPLATE,
  fields: FIELDS
};

const VALIDATION: TemplateValidation = {
  documentTypeId: 1,
  templateId: 6,
  templateName: 'fiche-v3.docx',
  variablesInTemplate: ['objet', 'date_debut'],
  fieldsInDatabase: ['objet', 'date_debut'],
  missingFields: [],
  unknownVariables: [],
  valid: true
};

describe('DocumentTypeConfigComponent', () => {
  let component: DocumentTypeConfigComponent;
  let fixture: ComponentFixture<DocumentTypeConfigComponent>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;

  const createComponent = (configuration: DocumentTypeForm): void => {
    fixture = TestBed.createComponent(DocumentTypeConfigComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.componentRef.setInput('id', '1');
    fixture.detectChanges();

    httpTesting.expectOne(FORM_URL).flush(configuration);
    fixture.detectChanges();
  };

  const buttonByText = (text: string): HTMLButtonElement | undefined =>
    Array.from(element.querySelectorAll<HTMLButtonElement>('button')).find((button) => button.textContent?.trim() === text);

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentTypeConfigComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    httpTesting = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  const openTab = (label: string): void => {
    Array.from(element.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
      .find((tab) => tab.textContent?.includes(label))
      ?.click();
    fixture.detectChanges();
  };

  it('should show the information, the template and the fields of the type', () => {
    createComponent(CONFIGURATION);

    expect(element.querySelector('h2')?.textContent).toContain('Fiche de suivi');
    expect(element.textContent).toContain('Type de document #1');
    expect(element.querySelector('.config-badges')?.textContent).toContain('Modèle v2');
    expect(element.textContent).toContain('fiche.docx');
    expect(element.textContent).toContain('18.5 Ko');
    expect(element.textContent).toContain('20/10/2026 à 14:30');

    openTab('Champs');
    const rows = Array.from(element.querySelectorAll('.config-field')).map((row) => row.textContent ?? '');
    expect(rows.length).toBe(2);
    expect(rows[1]).toContain('date_debut');
    expect(rows[1]).toContain('Date');
    expect(rows[0]).toContain('*');
    expect(rows[1]).not.toContain('*');
    expect(buttonByText('Tester la génération')?.disabled).toBeFalse();
  });

  it('should ask for a template and block the test when there is none', () => {
    createComponent({ ...CONFIGURATION, template: null, fields: [] });

    expect(element.querySelector('app-file-upload')).not.toBeNull();
    expect(buttonByText('Tester la génération')?.disabled).toBeTrue();
    expect(element.querySelector('.config-badges')?.textContent).toContain('Sans modèle');

    openTab('Champs');
    expect(element.textContent).toContain('Aucun champ');

    openTab('Vérification');
    expect(buttonByText('Vérifier le modèle')?.disabled).toBeTrue();
  });

  it('should upload a new template, then check it right away', () => {
    createComponent(CONFIGURATION);
    const file = new File(['docx'], 'fiche-v3.docx');

    component.replacingTemplate.set(true);
    component.pendingFile.set(file);
    component.uploadTemplate();

    const upload = httpTesting.expectOne(`${API_BASE_URL}/document-types/1/template`);
    expect((upload.request.body as FormData).get('file')).toBe(file);
    upload.flush({ ...TEMPLATE, id: 6, nomFichierOriginal: 'fiche-v3.docx', version: 3 });

    httpTesting.expectOne(`${API_BASE_URL}/document-types/1/template/validate-variables`).flush(VALIDATION);
    fixture.detectChanges();

    expect(component.template()?.version).toBe(3);
    expect(component.replacingTemplate()).toBeFalse();
    expect(component.activeTab()).toBe('check');
    expect(element.textContent).toContain('Modèle valide');
  });

  it('should add a field at the end of the list and forget the last check', () => {
    createComponent(CONFIGURATION);
    component.validation.set(VALIDATION);

    component.openFieldForm(null);
    component.saveField({ documentTypeId: 1, nom: 'lieu', libelle: 'Lieu', type: 'TEXT', obligatoire: false });

    const request = httpTesting.expectOne(`${API_BASE_URL}/document-fields`);
    expect(request.request.method).toBe('POST');
    request.flush({ ...FIELDS[0], id: 12, nom: 'lieu', libelle: 'Lieu', ordre: 3 });
    fixture.detectChanges();

    expect(component.fields().map((field) => field.nom)).toEqual(['objet', 'date_debut', 'lieu']);
    expect(component.fieldFormOpen()).toBeFalse();
    expect(component.validation()).toBeNull();
  });

  it('should exclude the edited field from the names already used', () => {
    createComponent(CONFIGURATION);

    component.openFieldForm(FIELDS[0]);

    expect(component.takenFieldNames()).toEqual(['date_debut']);
  });

  it('should delete a field after confirmation and reload the new order', () => {
    createComponent(CONFIGURATION);

    component.askFieldDeletion(FIELDS[0]);
    fixture.detectChanges();
    expect(element.textContent).toContain('Ce champ sera retiré du formulaire');

    component.confirmFieldDeletion();
    httpTesting.expectOne(`${API_BASE_URL}/document-fields/10`).flush(null, { status: 204, statusText: 'No Content' });
    httpTesting.expectOne(FORM_URL).flush({ ...CONFIGURATION, fields: [{ ...FIELDS[1], ordre: 1 }] });
    fixture.detectChanges();

    expect(component.fieldToDelete()).toBeNull();
    expect(component.fields()).toEqual([{ ...FIELDS[1], ordre: 1 }]);
  });

  it('should load the other type when another one is opened in the panel', async () => {
    createComponent(CONFIGURATION);
    component.validation.set(VALIDATION);

    fixture.componentRef.setInput('id', '2');
    fixture.detectChanges();
    await fixture.whenStable();

    httpTesting.expectOne(`${API_BASE_URL}/document-types/2/form`).flush({
      ...CONFIGURATION,
      documentType: { ...CONFIGURATION.documentType, id: 2, nom: 'Rapport' },
      fields: []
    });
    fixture.detectChanges();

    expect(element.querySelector('h2')?.textContent).toContain('Rapport');
    expect(component.validation()).toBeNull();
  });

  it('should tell the list when the type is modified, and close the panel', () => {
    createComponent(CONFIGURATION);
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    const changes: string[] = [];
    component.documentTypeChanged.subscribe((documentType) => changes.push(documentType.nom));

    component.saveDocumentType({ code: 'FICHE', nom: 'Fiche v2', description: null });
    httpTesting.expectOne(`${API_BASE_URL}/document-types/1`).flush({ ...CONFIGURATION.documentType, nom: 'Fiche v2' });

    expect(changes).toEqual(['Fiche v2']);

    element.querySelector<HTMLButtonElement>('button[aria-label="Fermer le panneau"]')?.click();
    expect(navigate).toHaveBeenCalledWith(['/document-types']);
  });

  it('should open the generation page of the type', () => {
    createComponent(CONFIGURATION);
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    buttonByText('Tester la génération')?.click();

    expect(navigate).toHaveBeenCalledWith(['/documents/generer', 1]);
  });

  it('should show the API message when the type does not exist', async () => {
    fixture = TestBed.createComponent(DocumentTypeConfigComponent);
    element = fixture.nativeElement;
    fixture.componentRef.setInput('id', '99');
    fixture.detectChanges();
    await fixture.whenStable();

    httpTesting
      .expectOne(`${API_BASE_URL}/document-types/99/form`)
      .flush({ status: 404, message: 'Type de document introuvable' }, { status: 404, statusText: 'Not Found' });
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.textContent).toContain('Type de document introuvable');
  });
});
