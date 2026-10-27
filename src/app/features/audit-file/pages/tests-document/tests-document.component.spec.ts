import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { AuditFileStore } from '../../services/audit-file.store';
import { TEST_AUDIT_TEST, TEST_MISSION, TEST_PROGRAMME } from '../../testing/audit-file-test-data';
import { TestsDocumentComponent } from './tests-document.component';

describe('TestsDocumentComponent', () => {
  let component: TestsDocumentComponent;
  let fixture: ComponentFixture<TestsDocumentComponent>;
  let httpTesting: HttpTestingController;
  let store: AuditFileStore;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TestsDocumentComponent],
      providers: [AuditFileStore, provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    store = TestBed.inject(AuditFileStore);
    store.mission.set(TEST_MISSION);
    store.programme.set(TEST_PROGRAMME);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(TestsDocumentComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should offer for the quality review only the members who have the matching role', () => {
    fixture.detectChanges();

    expect(component.auditeurOptions()).toEqual([{ value: '4', label: 'Randria Hery' }]);
    expect(component.chefOptions().map((option) => option.value)).toEqual(['2', '5']);
    expect(component.superviseurOptions().map((option) => option.label)).toEqual(['Rasoa Lova']);
  });

  it('should show the test sheet with its samples and its result', () => {
    store.tests.set([TEST_AUDIT_TEST]);
    fixture.detectChanges();

    const sheet = element.querySelector('app-document-sheet')?.textContent?.replace(/\s+/g, ' ') ?? '';
    expect(sheet).toContain('Référence : TEST-001');
    expect(sheet).toContain('ECH-001');
    expect(sheet).toContain('Résultat du test : Ineffectif');
    expect(sheet).toContain('Risque maîtrisé : Non');
  });

  it('should create a test on a programme line with its samples', () => {
    fixture.detectChanges();
    component.startCreating();
    component.updateField('auditeurMissionPersonneId', '4');
    component.updateEchantillon(0, { anomalieDetectee: true, observation: ' Ordinateur sans mot de passe. ' });
    component.risqueMaitrise.set(true);
    component.save();

    const request = httpTesting.expectOne(`${API_BASE_URL}/tests`);
    expect(request.request.body.ligneProgrammeId).toBe(31);
    expect(request.request.body.auditeurMissionPersonneId).toBe(4);
    expect(request.request.body.risqueMaitrise).toBeTrue();
    expect(request.request.body.echantillons).toEqual([
      { id: null, anomalieDetectee: true, observation: 'Ordinateur sans mot de passe.' }
    ]);
    request.flush(TEST_AUDIT_TEST);

    expect(store.tests()).toEqual([TEST_AUDIT_TEST]);
  });
});
