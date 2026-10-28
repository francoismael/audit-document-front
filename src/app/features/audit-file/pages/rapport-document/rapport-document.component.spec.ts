import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { todayAsText } from '../../../missions/models/mission-labels';
import { AuditFileStore } from '../../services/audit-file.store';
import { TEST_MISSION, TEST_RAPPORT } from '../../testing/audit-file-test-data';
import { RapportDocumentComponent } from './rapport-document.component';

describe('RapportDocumentComponent', () => {
  let component: RapportDocumentComponent;
  let fixture: ComponentFixture<RapportDocumentComponent>;
  let httpTesting: HttpTestingController;
  let store: AuditFileStore;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RapportDocumentComponent],
      providers: [AuditFileStore, provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    store = TestBed.inject(AuditFileStore);
    store.mission.set(TEST_MISSION);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(RapportDocumentComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should start a new report with the values of the cover page of Document.docx', () => {
    fixture.detectChanges();
    component.startEditing();

    expect(component.draft()).toEqual({
      motifs: '',
      nature: '',
      versionRapport: 'provisoire',
      dateEmission: todayAsText(),
      proprietaireDocument: "Direction de l'Audit Interne",
      destinataires: 'Autorités Supérieures\nDirection des Ressources Humaines',
      classification: 'Non public'
    });
  });

  it('should create the report, then update it', () => {
    fixture.detectChanges();
    component.startEditing();
    component.updateField('motifs', '  Programme annuel de la DAI.  ');
    component.updateVersion('definitif');
    component.save();

    const creation = httpTesting.expectOne(`${API_BASE_URL}/rapports`);
    expect(creation.request.method).toBe('POST');
    expect(creation.request.body.missionId).toBe(10);
    expect(creation.request.body.motifs).toBe('Programme annuel de la DAI.');
    expect(creation.request.body.nature).toBeNull();
    expect(creation.request.body.versionRapport).toBe('definitif');
    creation.flush(TEST_RAPPORT);
    expect(store.rapport()).toEqual(TEST_RAPPORT);

    component.startEditing();
    expect(component.draft().nature).toBe('Audit de conformité');
    component.save();
    expect(httpTesting.expectOne(`${API_BASE_URL}/rapports/80`).request.method).toBe('PUT');
  });

  it('should show the cover page with the mission order and the ticked classification', () => {
    store.rapport.set(TEST_RAPPORT);
    fixture.detectChanges();

    const sheet = element.querySelector('app-document-sheet')?.textContent?.replace(/\s+/g, ' ') ?? '';
    expect(sheet).toContain('RAPPORT D’AUDIT SUR Contrôle des procédures comptables.');
    expect(sheet).toContain('(OM : N° 005-2026-MEF/DAI)');
    expect(sheet).toContain('Rapport définitif');
    expect(sheet).toContain('OM n° 005-2026-MEF/DAI du 30/10/2026');
    expect(sheet).toContain('20/12/2026');
    expect(sheet).toContain('☒ Non public');
    expect(sheet).toContain('☐ Réservé aux Autorités Supérieures');
    // One row per recipient, the label spanning them.
    expect(element.querySelector('td[rowspan="2"]')?.textContent).toContain('Destinataires du document');
  });
});
