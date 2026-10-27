import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { AuditFileStore } from '../../services/audit-file.store';
import { TEST_AUDIT_TEST, TEST_CONSTAT, TEST_MISSION, TEST_TDR } from '../../testing/audit-file-test-data';
import { ConstatsDocumentComponent } from './constats-document.component';

describe('ConstatsDocumentComponent', () => {
  let component: ConstatsDocumentComponent;
  let fixture: ComponentFixture<ConstatsDocumentComponent>;
  let httpTesting: HttpTestingController;
  let store: AuditFileStore;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ConstatsDocumentComponent],
      providers: [AuditFileStore, provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    store = TestBed.inject(AuditFileStore);
    store.mission.set(TEST_MISSION);
    store.tdr.set(TEST_TDR);
    store.tests.set([TEST_AUDIT_TEST]);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ConstatsDocumentComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should show a constat as a "model n°02" sheet, then all of them as the summary table', () => {
    store.constats.set([TEST_CONSTAT]);
    fixture.detectChanges();

    const sheet = element.querySelector('app-document-sheet')?.textContent?.replace(/\s+/g, ' ') ?? '';
    expect(sheet).toContain('Constat n° CST-001');
    expect(sheet).toContain('Installer un antivirus. (retenue)');

    component.view.set('tableau');
    fixture.detectChanges();

    const table = element.querySelector('.constats-table')?.textContent?.replace(/\s+/g, ' ') ?? '';
    expect(table).toContain('Objectif OBJ-01 : S’assurer de la fiabilité des comptes.');
    expect(table).toContain('Intrusion non autorisée.');
    expect(table).toContain('Élevé');
  });

  it('should keep a single retained recommendation', () => {
    fixture.detectChanges();
    component.startCreating();
    component.addRecommandation();

    component.retainRecommandation(1, true);

    expect(component.recommandations().map((item) => item.retenue)).toEqual([false, true]);
  });

  it('should require the description and the texts, then create the constat', () => {
    fixture.detectChanges();
    component.startCreating();

    component.save();
    fixture.detectChanges();
    expect(element.textContent).toContain('La description du constat est obligatoire.');
    expect(element.textContent).toContain('doit avoir un texte');

    component.updateField('descriptions', ' Les ordinateurs ne sont pas protégés. ');
    component.updateItem('causes', 0, 'Absence de politique de sécurité.');
    component.updateItem('consequences', 0, 'Modification des données.');
    component.updateRisque(0, { descriptions: 'Intrusion non autorisée.', niveau: 'ELEVE' });
    component.updateRecommandation(0, 'Installer un antivirus.');
    component.save();

    const request = httpTesting.expectOne(`${API_BASE_URL}/constats`);
    expect(request.request.body.testId).toBe(40);
    expect(request.request.body.descriptions).toBe('Les ordinateurs ne sont pas protégés.');
    expect(request.request.body.recommandations).toEqual([{ id: null, description: 'Installer un antivirus.', retenue: true }]);
    request.flush(TEST_CONSTAT);

    expect(store.constats()).toEqual([TEST_CONSTAT]);
  });
});
