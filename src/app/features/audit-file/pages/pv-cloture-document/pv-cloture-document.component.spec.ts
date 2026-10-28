import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { AuditFileStore } from '../../services/audit-file.store';
import {
  TEST_AUDIT_TEST,
  TEST_CLOSING_REUNION,
  TEST_CONSTAT,
  TEST_MISSION,
  TEST_TDR
} from '../../testing/audit-file-test-data';
import { PvClotureDocumentComponent } from './pv-cloture-document.component';

describe('PvClotureDocumentComponent', () => {
  let component: PvClotureDocumentComponent;
  let fixture: ComponentFixture<PvClotureDocumentComponent>;
  let httpTesting: HttpTestingController;
  let store: AuditFileStore;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PvClotureDocumentComponent],
      providers: [AuditFileStore, provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    store = TestBed.inject(AuditFileStore);
    store.mission.set(TEST_MISSION);
    store.tdr.set({ ...TEST_TDR, perimetre: 'Gestion financière 2025.' });
    store.tests.set([TEST_AUDIT_TEST]);
    store.constats.set([TEST_CONSTAT]);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PvClotureDocumentComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should prefill a new PV from the audit file', () => {
    fixture.detectChanges();
    component.startEditing();

    const draft = component.draft();
    expect(draft.remerciements).toContain('Direction des Ressources Humaines');
    expect(draft.rappelPerimetre).toBe('Gestion financière 2025.');
    expect(draft.syntheseConstats).toBe('CST-001 : Les ordinateurs ne sont pas protégés.');
    expect(draft.resumeResultatsVerification).toBe('1 test(s) réalisé(s) : 1 ineffectif.');
    // Only the retained recommendation.
    expect(draft.resumeRecommandationsPlansActions).toBe('CST-001 : Installer un antivirus.');
    expect([...component.selectedEntite()]).toEqual([5]);
  });

  it('should require the date, then save a closing meeting', () => {
    fixture.detectChanges();
    component.startEditing();
    component.save();
    expect(component.dateError()).toBe('La date de la réunion est obligatoire.');

    component.updateField('dateReunion', '2026-12-15');
    component.updateField('pointsFortsIdentifies', '  Équipe disponible.  ');
    component.toggleParticipant('EQUIPE_DAI', 1, false);
    component.save();

    const request = httpTesting.expectOne(`${API_BASE_URL}/reunions`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.type).toBe('CLOTURE');
    expect(request.request.body.pointsFortsIdentifies).toBe('Équipe disponible.');
    expect(request.request.body.participants).toEqual([
      { personneId: 5, role: 'POINT_FOCAL', typeParticipant: 'ENTITE_AUDITEE' },
      { personneId: 2, role: 'CHEF_MISSION', typeParticipant: 'EQUIPE_DAI' },
      { personneId: 3, role: 'SUPERVISEUR', typeParticipant: 'EQUIPE_DAI' },
      { personneId: 4, role: 'AUDITEUR', typeParticipant: 'EQUIPE_DAI' }
    ]);
    request.flush(TEST_CLOSING_REUNION);

    expect(store.closingReunion()).toEqual(TEST_CLOSING_REUNION);
  });

  it('should show the PV as in Document.docx', () => {
    store.closingReunion.set(TEST_CLOSING_REUNION);
    fixture.detectChanges();

    const sheet = element.querySelector('app-reunion-sheet')?.textContent?.replace(/\s+/g, ' ') ?? '';
    expect(sheet).toContain('Procès-verbal de réunion de clôture');
    expect(sheet).toContain("Restitution des résultats de la mission d'audit");
    expect(sheet).toContain('Ravelo Tiana, Directeur des RH');
    expect(sheet).toContain('Points forts identifiés :');
    expect(sheet).toContain('Équipe disponible.');
    expect(sheet).toContain('La DRH accepte les recommandations.');
    expect(sheet).toContain('La séance a été levée à 11h00.');
  });

  it('should delete the PV after confirmation', () => {
    store.closingReunion.set(TEST_CLOSING_REUNION);
    fixture.detectChanges();
    component.confirmDeletion();

    httpTesting.expectOne(`${API_BASE_URL}/reunions/41`).flush(null);
    expect(store.closingReunion()).toBeNull();
  });
});
