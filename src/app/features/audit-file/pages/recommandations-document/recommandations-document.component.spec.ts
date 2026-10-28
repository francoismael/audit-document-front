import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { AuditFileStore } from '../../services/audit-file.store';
import { TEST_MISSION, TEST_TABLEAU } from '../../testing/audit-file-test-data';
import { RecommandationsDocumentComponent } from './recommandations-document.component';

describe('RecommandationsDocumentComponent', () => {
  let component: RecommandationsDocumentComponent;
  let fixture: ComponentFixture<RecommandationsDocumentComponent>;
  let httpTesting: HttpTestingController;
  let store: AuditFileStore;
  let element: HTMLElement;

  const tableauUrl = `${API_BASE_URL}/tableau-recommandations/mission/10`;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecommandationsDocumentComponent],
      providers: [AuditFileStore, provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    store = TestBed.inject(AuditFileStore);
    store.mission.set(TEST_MISSION);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RecommandationsDocumentComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;

    // The table is read again when the page opens.
    httpTesting.expectOne(tableauUrl).flush(TEST_TABLEAU);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should show the table of Document.docx', () => {
    const sheet = element.querySelector('app-document-sheet')?.textContent?.replace(/\s+/g, ' ') ?? '';

    expect(sheet).toContain('Tableau des recommandations regroupées');
    expect(sheet).toContain("Mission d'audit : Audit de la gestion financière");
    expect(sheet).toContain('Entité auditée : Direction des Ressources Humaines');
    expect(sheet).toContain('Installer un antivirus.');
    expect(sheet).toContain('Sauvegarde mise en place. (10/12/2026)');
    expect(element.querySelectorAll('.recommandations-maintien')[1].textContent?.trim()).toBe('Non');
  });

  it('should save the response before deciding the maintenance, then read the table again', () => {
    component.startEditing();
    component.updateReponse(0, ' Un antivirus sera installé. ');
    component.updateDraft(0, { dateReponse: '2026-12-12' });
    component.updateMaintien(0, 'oui');
    component.save();

    const creation = httpTesting.expectOne(`${API_BASE_URL}/reponses`);
    expect(creation.request.body).toEqual({ recommandationId: 4, descriptions: 'Un antivirus sera installé.', dateReponse: '2026-12-12' });
    creation.flush({ id: 91 });

    const decision = httpTesting.expectOne(`${API_BASE_URL}/recommandations/4/maintien`);
    expect(decision.request.method).toBe('PUT');
    expect(decision.request.body).toEqual({ maintenue: true });
    decision.flush({});

    const updated = { ...TEST_TABLEAU, lignes: TEST_TABLEAU.lignes.map((ligne) => ({ ...ligne, recommandationMaintenue: true })) };
    httpTesting.expectOne(tableauUrl).flush(updated);

    expect(store.tableauRecommandations()).toEqual(updated);
    expect(component.editing()).toBeFalse();
  });

  it('should delete an emptied response and clear its decision', () => {
    component.startEditing();
    component.updateReponse(1, '  ');

    expect(component.drafts()[1].maintien).toBe('');

    component.save();
    expect(httpTesting.expectOne(`${API_BASE_URL}/reponses/90`).request.method).toBe('DELETE');
  });

  it('should refuse a decision without a response', () => {
    component.startEditing();
    component.updateMaintien(0, 'non');
    component.save();

    expect(component.invalidLines()).toEqual([4]);
  });

  it('should close the form without any call when nothing changed', () => {
    component.startEditing();
    component.save();

    expect(component.editing()).toBeFalse();
  });
});
