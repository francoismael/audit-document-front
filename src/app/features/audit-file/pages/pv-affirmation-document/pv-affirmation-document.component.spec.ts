import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { PvAffirmation } from '../../models/pv-affirmation.model';
import { AuditFileStore } from '../../services/audit-file.store';
import { TEST_CONSTAT, TEST_MISSION } from '../../testing/audit-file-test-data';
import { PvAffirmationDocumentComponent } from './pv-affirmation-document.component';

const PV: PvAffirmation = {
  id: 70,
  missionId: 10,
  missionNumero: '005',
  missionIntitule: TEST_MISSION.intitule,
  missionObjet: null,
  structureNom: 'Direction des Ressources Humaines',
  dateEntretien: '2026-11-20',
  lieu: 'Antananarivo',
  observationsComplementaires: null,
  participants: [
    { id: 1, missionPersonneId: 2, personneId: 2, nom: 'Rabe', prenom: 'Aina', fonction: 'Chef de service', roles: 'CHEF_MISSION', typeParticipant: 'AUDITEUR' },
    { id: 2, missionPersonneId: 6, personneId: 5, nom: 'Ravelo', prenom: 'Tiana', fonction: 'Directeur des RH', roles: 'POINT_FOCAL', typeParticipant: 'ENTITE_AUDITEE' }
  ],
  lignes: [
    {
      id: 1,
      constatId: 60,
      referenceConstat: 'CST-001',
      question: 'Les ordinateurs ne sont pas protégés.',
      reponseEntite: 'Un antivirus sera installé.',
      piecesJustificatives: null,
      commentairesAuditeurs: null
    }
  ]
};

describe('PvAffirmationDocumentComponent', () => {
  let component: PvAffirmationDocumentComponent;
  let fixture: ComponentFixture<PvAffirmationDocumentComponent>;
  let httpTesting: HttpTestingController;
  let store: AuditFileStore;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PvAffirmationDocumentComponent],
      providers: [AuditFileStore, provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    store = TestBed.inject(AuditFileStore);
    store.mission.set(TEST_MISSION);
    store.constats.set([TEST_CONSTAT]);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PvAffirmationDocumentComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should start a new PV with the whole team, the points focaux and every constat', () => {
    fixture.detectChanges();
    component.startEditing();

    expect([...component.selectedAuditeurs()]).toEqual([1, 2, 3, 4]);
    expect([...component.selectedEntite()]).toEqual([6]);
    expect(component.lignes()[0].included).toBeTrue();
    expect(component.lignes()[0].question).toBe('Les ordinateurs ne sont pas protégés.');
  });

  it('should send the attendees by missionPersonneId and only the retained constats', () => {
    fixture.detectChanges();
    component.startEditing();
    component.toggleParticipant('AUDITEUR', 3, false);
    component.updateLigne(0, { reponseEntite: ' Un antivirus sera installé. ' });
    component.save();

    const request = httpTesting.expectOne(`${API_BASE_URL}/pv-affirmations`);
    expect(request.request.body.participants).toEqual([
      { missionPersonneId: 1, typeParticipant: 'AUDITEUR' },
      { missionPersonneId: 2, typeParticipant: 'AUDITEUR' },
      { missionPersonneId: 4, typeParticipant: 'AUDITEUR' },
      { missionPersonneId: 6, typeParticipant: 'ENTITE_AUDITEE' }
    ]);
    expect(request.request.body.lignes[0].constatId).toBe(60);
    expect(request.request.body.lignes[0].reponseEntite).toBe('Un antivirus sera installé.');
    request.flush(PV);

    expect(store.pvAffirmation()).toEqual(PV);
  });

  it('should refuse a PV without any retained constat', () => {
    fixture.detectChanges();
    component.startEditing();
    component.updateLigne(0, { included: false });
    component.save();

    expect(component.lignesError()).toBe('Retenez au moins un constat.');
  });

  it('should show the PV as in Document.docx, ending with the place and the date', () => {
    store.pvAffirmation.set(PV);
    fixture.detectChanges();

    const sheet = element.querySelector('app-document-sheet')?.textContent?.replace(/\s+/g, ' ') ?? '';
    expect(sheet).toContain('[OM N° 005]');
    expect(sheet).toContain('du 02/11/2026 au 27/11/2026');
    expect(sheet).toContain('Ravelo Tiana, Directeur des RH');
    expect(sheet).toContain('Un antivirus sera installé.');
    expect(element.querySelector('.document-date')?.textContent?.trim()).toBe('Fait à Antananarivo, le 20/11/2026');
  });
});
