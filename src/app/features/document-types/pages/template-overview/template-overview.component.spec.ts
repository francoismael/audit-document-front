import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { DocumentType } from '../../models/document-type.model';
import { TemplateOverviewComponent } from './template-overview.component';

const TYPE: DocumentType = {
  id: 1,
  code: 'NOTE',
  nom: 'Note de service',
  description: null,
  actif: true,
  dateCreation: '2026-10-19T10:00:00'
};

const TEMPLATE = {
  id: 5,
  documentTypeId: 1,
  documentTypeNom: 'Note de service',
  nomFichierOriginal: 'note.docx',
  typeMime: null,
  taille: 1024,
  version: 2,
  actif: true,
  dateUpload: '2026-10-21T08:00:00'
};

const FIELD = { id: 1, documentTypeId: 1, documentTypeNom: 'Note de service', nom: 'objet', libelle: 'Objet', type: 'TEXT', obligatoire: true, ordre: 1 };

describe('TemplateOverviewComponent', () => {
  let component: TemplateOverviewComponent;
  let fixture: ComponentFixture<TemplateOverviewComponent>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateOverviewComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateOverviewComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();

    httpTesting.expectOne(`${API_BASE_URL}/document-types`).flush([
      TYPE,
      { ...TYPE, id: 2, code: 'LETTRE', nom: 'Lettre', actif: false }
    ]);
    httpTesting
      .expectOne(`${API_BASE_URL}/document-types/1/form`)
      .flush({ documentType: TYPE, template: TEMPLATE, fields: [FIELD, { ...FIELD, id: 2, nom: 'date', obligatoire: false }] });
    httpTesting
      .expectOne(`${API_BASE_URL}/document-types/2/form`)
      .flush({ documentType: { ...TYPE, id: 2, nom: 'Lettre', actif: false }, template: null, fields: [] });
    // Only the type with a template is checked.
    httpTesting.expectOne(`${API_BASE_URL}/document-types/1/template/validate-variables`).flush({
      documentTypeId: 1,
      templateId: 5,
      templateName: 'note.docx',
      variablesInTemplate: ['objet', 'signataire'],
      fieldsInDatabase: ['objet', 'date'],
      missingFields: ['signataire'],
      unknownVariables: [],
      valid: false
    });
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should show each type with its template, its fields and the check', () => {
    const text = element.textContent?.replace(/\s+/g, ' ') ?? '';

    expect(text).toContain('note.docx');
    expect(text).toContain('Version 2 · 21/10/2026');
    expect(text).toContain('dont 1 obligatoire(s)');
    expect(text).toContain('1 écart');
    expect(text).toContain('Aucun modèle');
    expect(text).toContain('Sans modèle');
    expect(component.withTemplate()).toBe(1);
    expect(component.validTemplates()).toBe(0);
  });

  it('should open the configuration of a type', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    component.configure(component.items()[0]);

    expect(navigate).toHaveBeenCalledWith(['/document-types', 1]);
  });
});
