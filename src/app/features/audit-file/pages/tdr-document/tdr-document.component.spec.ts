import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { todayAsText } from '../../../missions/models/mission-labels';
import { Tdr } from '../../models/tdr.model';
import { AuditFileStore } from '../../services/audit-file.store';
import { TEST_MISSION } from '../../testing/audit-file-test-data';
import { TdrDocumentComponent } from './tdr-document.component';

const TDR: Tdr = {
  id: 1,
  missionId: 10,
  missionNumero: '005',
  missionIntitule: TEST_MISSION.intitule,
  missionObjet: null,
  structureId: 3,
  structureNom: 'Direction des Ressources Humaines',
  contexte: 'Demande du Ministre.',
  competence: 'Décret portant organisation de la DAI.',
  perimetre: 'Gestion financière.',
  periodeObservation: '2025',
  lieu: 'Antananarivo',
  methodologieTravail: 'Phase I',
  resultatsAttendus: null,
  livrables: 'Rapport',
  dateTdr: '2026-10-28',
  objectifs: [{ id: 7, numero: 'OBJ-01', descriptions: 'S’assurer de la fiabilité des comptes.' }]
};

describe('TdrDocumentComponent', () => {
  let component: TdrDocumentComponent;
  let fixture: ComponentFixture<TdrDocumentComponent>;
  let httpTesting: HttpTestingController;
  let store: AuditFileStore;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TdrDocumentComponent],
      providers: [AuditFileStore, provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    store = TestBed.inject(AuditFileStore);
    store.mission.set(TEST_MISSION);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TdrDocumentComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should invite to write the TDR, starting from the plan of Document.docx', () => {
    fixture.detectChanges();
    expect(element.textContent).toContain('Pas encore de termes de référence');

    component.startEditing();
    fixture.detectChanges();

    expect(component.draft().methodologieTravail).toContain("Phase I : Prise de connaissance de l'entité");
    expect(component.objectifs().length).toBe(1);
    expect(component.draft().dateTdr).toBe(todayAsText());
  });

  it('should refuse an empty objective, then create the TDR', () => {
    fixture.detectChanges();
    component.startEditing();
    component.updateField('contexte', '  Demande du Ministre. ');

    component.save();
    fixture.detectChanges();
    expect(element.textContent).toContain('Chaque objectif doit avoir une description');

    component.updateObjectif(0, 'S’assurer de la fiabilité des comptes.');
    component.save();

    const request = httpTesting.expectOne(`${API_BASE_URL}/tdrs`);
    expect(request.request.method).toBe('POST');
    expect(request.request.body.contexte).toBe('Demande du Ministre.');
    expect(request.request.body.dateTdr).toBe(todayAsText());
    expect(request.request.body.objectifs).toEqual([{ id: null, descriptions: 'S’assurer de la fiabilité des comptes.' }]);
    request.flush(TDR);

    expect(store.tdr()).toEqual(TDR);
    expect(component.editing()).toBeFalse();
  });

  it('should show the TDR on the A4 sheet and keep the objectives ids when editing', () => {
    store.tdr.set(TDR);
    fixture.detectChanges();

    const sheet = element.querySelector('app-document-sheet')?.textContent ?? '';
    expect(sheet).toContain('portant sur « Audit de la gestion financière »');
    expect(sheet).toContain('OBJ-01 :');
    expect(sheet).toContain('[À compléter]');
    expect(sheet).toContain('Antananarivo, le 28/10/2026');

    component.startEditing();
    component.addObjectif();
    component.updateObjectif(1, 'S’assurer du respect des procédures.');
    component.save();

    const request = httpTesting.expectOne(`${API_BASE_URL}/tdrs/1`);
    expect(request.request.body.objectifs).toEqual([
      { id: 7, descriptions: 'S’assurer de la fiabilité des comptes.' },
      { id: null, descriptions: 'S’assurer du respect des procédures.' }
    ]);
    request.flush(TDR);
  });

  it('should delete the TDR after confirmation', () => {
    store.tdr.set(TDR);
    fixture.detectChanges();

    component.confirmDeletion();
    httpTesting.expectOne(`${API_BASE_URL}/tdrs/1`).flush(null, { status: 204, statusText: 'No Content' });

    expect(store.tdr()).toBeNull();
  });
});
