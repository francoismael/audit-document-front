import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { DocumentType } from '../../../document-types/models/document-type.model';
import { DocumentCatalogComponent } from './document-catalog.component';

const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 1,
    code: 'FICHE_SUIVI',
    nom: 'Fiche de suivi',
    description: 'Suivi des recommandations.',
    actif: true,
    dateCreation: '2026-10-07T08:06:13'
  },
  {
    id: 2,
    code: 'RAPPORT',
    nom: 'Rapport d\'activité électronique',
    description: null,
    actif: true,
    dateCreation: '2026-10-08T12:39:41'
  },
  {
    id: 3,
    code: 'ANCIEN',
    nom: 'Ancien modèle',
    description: null,
    actif: false,
    dateCreation: '2026-09-01T10:00:00'
  }
];

describe('DocumentCatalogComponent', () => {
  let component: DocumentCatalogComponent;
  let fixture: ComponentFixture<DocumentCatalogComponent>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentCatalogComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentCatalogComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  const respondWith = (documentTypes: DocumentType[]): void => {
    httpTesting.expectOne(`${API_BASE_URL}/document-types`).flush(documentTypes);
    fixture.detectChanges();
  };

  const cardTitles = (): string[] =>
    Array.from(element.querySelectorAll('.card-title')).map((title) => title.textContent?.trim() ?? '');

  it('should show a loader while the catalog loads', () => {
    expect(element.querySelector('app-loading')).not.toBeNull();

    respondWith([]);
  });

  it('should only show active document types', () => {
    respondWith(DOCUMENT_TYPES);

    expect(cardTitles()).toEqual(['Fiche de suivi', 'Rapport d\'activité électronique']);
  });

  it('should filter by name or code, ignoring case and accents', () => {
    respondWith(DOCUMENT_TYPES);

    expect(component.countLabel()).toBe('2 types de documents');

    component.search.set('ELECTRONIQUE');
    fixture.detectChanges();
    expect(cardTitles()).toEqual(['Rapport d\'activité électronique']);
    expect(component.countLabel()).toBe('1 résultat sur 2');

    component.search.set('fiche_suivi');
    fixture.detectChanges();
    expect(cardTitles()).toEqual(['Fiche de suivi']);

    component.search.set('introuvable');
    fixture.detectChanges();
    expect(cardTitles()).toEqual([]);
    expect(element.textContent).toContain('Aucun résultat');
  });

  it('should show the API error message', async () => {
    httpTesting
      .expectOne(`${API_BASE_URL}/document-types`)
      .flush({ status: 500, message: 'Erreur de base de données' }, { status: 500, statusText: 'Server Error' });

    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.textContent).toContain('Impossible de charger le catalogue');
    expect(element.textContent).toContain('Erreur de base de données');
  });

  it('should show an empty state when no document type is active', () => {
    respondWith([DOCUMENT_TYPES[2]]);

    expect(element.textContent).toContain('Aucun type de document disponible');
  });

  it('should open the generation page of the chosen document type', () => {
    respondWith(DOCUMENT_TYPES);
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    component.openGenerator(DOCUMENT_TYPES[0]);

    expect(navigate).toHaveBeenCalledWith(['/documents/generer', 1]);
  });
});
