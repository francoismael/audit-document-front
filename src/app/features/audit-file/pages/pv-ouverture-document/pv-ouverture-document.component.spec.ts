import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { Reunion } from '../../models/reunion.model';
import { AuditFileStore } from '../../services/audit-file.store';
import { TEST_MISSION } from '../../testing/audit-file-test-data';
import { PvOuvertureDocumentComponent } from './pv-ouverture-document.component';

const REUNION: Reunion = {
  id: 40,
  missionId: 10,
  missionNumero: '005',
  missionIntitule: TEST_MISSION.intitule,
  type: 'OUVERTURE',
  dateReunion: '2026-11-02',
  heureDebut: '09:00:00',
  heureFin: '10:30:00',
  heureLevee: '10:30:00',
  lieu: 'Salle de réunion de la DRH',
  observations: null,
  pointsDaiIntroduction: 'Remerciements.',
  pointsDaiPresentationMission: null,
  pointsDaiMethodologie: null,
  pointsInterlocuteursIntroduction: null,
  pointsInterlocuteursProcessus: null,
  pointsInterlocuteursOrganisation: null,
  remerciements: null,
  rappelPerimetre: null,
  syntheseConstats: null,
  pointsFortsIdentifies: null,
  resumeResultatsVerification: null,
  resumeRecommandationsPlansActions: null,
  observationsCommentaires: null,
  participants: [
    { id: 1, personneId: 5, nom: 'Ravelo', prenom: 'Tiana', matricule: null, fonction: 'Directeur des RH', service: 'DRH', role: 'POINT_FOCAL', typeParticipant: 'ENTITE_AUDITEE' },
    { id: 2, personneId: 2, nom: 'Rabe', prenom: 'Aina', matricule: null, fonction: 'Chef de service', service: 'DAI', role: 'CHEF_MISSION', typeParticipant: 'EQUIPE_DAI' }
  ]
};

describe('PvOuvertureDocumentComponent', () => {
  let component: PvOuvertureDocumentComponent;
  let fixture: ComponentFixture<PvOuvertureDocumentComponent>;
  let httpTesting: HttpTestingController;
  let store: AuditFileStore;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PvOuvertureDocumentComponent],
      providers: [AuditFileStore, provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    store = TestBed.inject(AuditFileStore);
    store.mission.set(TEST_MISSION);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(PvOuvertureDocumentComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should prefill a new PV with the points of Document.docx and all the attendees', () => {
    fixture.detectChanges();
    component.startEditing();
    fixture.detectChanges();

    expect(component.draft().pointsDaiIntroduction).toContain("Présentation de l'Ordre de mission n° 005.");
    expect([...component.selectedEntite()]).toEqual([5]);
    expect([...component.selectedDai()]).toEqual([1, 2, 3, 4]);
    expect(element.textContent).toContain("Représentants de l'entité auditée");
  });

  it('should require the date, then send the points focaux and the DAI team as attendees', () => {
    fixture.detectChanges();
    component.startEditing();
    component.toggleParticipant('EQUIPE_DAI', 3, false);

    component.save();
    fixture.detectChanges();
    expect(element.textContent).toContain('La date de la réunion est obligatoire.');

    component.updateField('dateReunion', '2026-11-02');
    component.updateField('heureDebut', '09:00');
    component.save();

    const request = httpTesting.expectOne(`${API_BASE_URL}/reunions`);
    expect(request.request.body.type).toBe('OUVERTURE');
    expect(request.request.body.heureDebut).toBe('09:00');
    expect(request.request.body.participants).toEqual([
      { personneId: 5, role: 'POINT_FOCAL', typeParticipant: 'ENTITE_AUDITEE' },
      { personneId: 1, role: 'DIRECTEUR_AUDIT_INTERNE', typeParticipant: 'EQUIPE_DAI' },
      { personneId: 2, role: 'CHEF_MISSION', typeParticipant: 'EQUIPE_DAI' },
      { personneId: 4, role: 'AUDITEUR', typeParticipant: 'EQUIPE_DAI' }
    ]);
    request.flush(REUNION);

    expect(store.openingReunion()).toEqual(REUNION);
  });

  it('should show the PV with the attendees of each side', () => {
    store.openingReunion.set(REUNION);
    fixture.detectChanges();

    const sheet = element.querySelector('app-document-sheet')?.textContent?.replace(/\s+/g, ' ') ?? '';
    expect(sheet).toContain('- 02/11/2026 -');
    expect(sheet).toContain('Réunion de lancement de la mission « Audit de la gestion financière »');
    expect(sheet).toContain('09h00');
    expect(sheet).toContain('Ravelo Tiana, Directeur des RH');
    expect(sheet).toContain('Rabe Aina, Chef de service');
    expect(sheet).toContain('La séance a été levée à 10h30.');
  });

  it('should tell how to add a point focal when the mission has none', () => {
    store.mission.set({ ...TEST_MISSION, personnes: TEST_MISSION.personnes.filter((member) => member.roles !== 'POINT_FOCAL') });
    fixture.detectChanges();
    component.startEditing();
    fixture.detectChanges();

    expect(element.textContent).toContain('Aucun point focal dans l\'équipe de la mission.');
  });
});
