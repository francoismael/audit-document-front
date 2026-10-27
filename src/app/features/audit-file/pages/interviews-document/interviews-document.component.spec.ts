import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { todayAsText } from '../../../missions/models/mission-labels';
import { Interview } from '../../models/interview.model';
import { AuditFileStore } from '../../services/audit-file.store';
import { TEST_MISSION } from '../../testing/audit-file-test-data';
import { InterviewsDocumentComponent } from './interviews-document.component';

const INTERVIEW: Interview = {
  id: 9,
  missionId: 10,
  missionNumero: '005',
  missionIntitule: TEST_MISSION.intitule,
  personneIntervieweeId: 5,
  personneIntervieweeNom: 'Ravelo',
  personneIntervieweePrenom: 'Tiana',
  reference: 'FI-001',
  dateInterview: '2026-11-04',
  fonction: 'Directeur des RH',
  anciennete: '3 ans',
  redigeParPersonneId: 4,
  redigeParPersonneNom: 'Randria',
  redigeParPersonnePrenom: 'Hery',
  superviseParPersonneId: null,
  superviseParPersonneNom: null,
  superviseParPersonnePrenom: null,
  valideParPersonneId: null,
  valideParPersonneNom: null,
  valideParPersonnePrenom: null,
  dateRedaction: '2026-11-04',
  dateSupervision: '2026-11-06',
  dateValidation: null,
  questions: [{ id: 1, numero: 1, question: 'Comment sont classés les dossiers ?', reponse: 'Par ordre d’arrivée.' }]
};

describe('InterviewsDocumentComponent', () => {
  let component: InterviewsDocumentComponent;
  let fixture: ComponentFixture<InterviewsDocumentComponent>;
  let httpTesting: HttpTestingController;
  let store: AuditFileStore;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InterviewsDocumentComponent],
      providers: [AuditFileStore, provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    store = TestBed.inject(AuditFileStore);
    store.mission.set(TEST_MISSION);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(InterviewsDocumentComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should show the interview sheet with its reference, visas and questions', () => {
    store.interviews.set([INTERVIEW]);
    fixture.detectChanges();

    const sheet = element.querySelector('app-document-sheet')?.textContent?.replace(/\s+/g, ' ') ?? '';
    expect(sheet).toContain('Référence : FI-001');
    const visas = Array.from(element.querySelectorAll('app-document-sheet table:not(.interview-header) tbody tr'))
      .slice(0, 3)
      .map((row) => Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent?.trim()));
    expect(visas[0]).toEqual(['Rédigé par', 'Randria Hery', '04/11/2026']);
    expect(visas[1][2]).toBe('06/11/2026');
    expect(visas[2][2]).toBe('……');
    expect(sheet).toContain('Ancienneté au poste : 3 ans');
    expect(sheet).toContain('Comment sont classés les dossiers ?');
  });

  it('should offer the points focaux first as interviewees and fill in their function', () => {
    fixture.detectChanges();
    component.startCreating();

    expect(component.intervieweeOptions()[0].label).toContain('Ravelo Tiana');
    component.chooseInterviewee('5');
    expect(component.draft().fonction).toBe('Directeur des RH');
  });

  it('should require the interviewee and the text of each question, then create the interview', () => {
    fixture.detectChanges();
    component.startCreating();

    component.save();
    fixture.detectChanges();
    expect(element.textContent).toContain('Choisissez la personne interviewée.');
    expect(element.textContent).toContain('Chaque question doit avoir un texte');

    component.chooseInterviewee('5');
    component.updateQuestion(0, 'question', ' Comment sont classés les dossiers ? ');
    component.updateField('redigeParPersonneId', '4');
    component.save();

    const request = httpTesting.expectOne(`${API_BASE_URL}/interviews`);
    expect(request.request.body.personneIntervieweeId).toBe(5);
    expect(request.request.body.redigeParPersonneId).toBe(4);
    // The writing date is today by default; the other visas have no date yet.
    expect(request.request.body.dateRedaction).toBe(todayAsText());
    expect(request.request.body.dateSupervision).toBeNull();
    expect(request.request.body.questions).toEqual([{ question: 'Comment sont classés les dossiers ?', reponse: null }]);
    request.flush(INTERVIEW);

    expect(store.interviews()).toEqual([INTERVIEW]);
    expect(component.editing()).toBeNull();
  });
});
