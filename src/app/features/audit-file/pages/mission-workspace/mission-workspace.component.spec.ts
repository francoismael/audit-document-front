import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { TEST_AUDIT_TEST, TEST_CONSTAT, TEST_MISSION, TEST_PROGRAMME } from '../../testing/audit-file-test-data';
import { MissionWorkspaceComponent } from './mission-workspace.component';

describe('MissionWorkspaceComponent', () => {
  let fixture: ComponentFixture<MissionWorkspaceComponent>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionWorkspaceComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(MissionWorkspaceComponent);
    httpTesting = TestBed.inject(HttpTestingController);
    element = fixture.nativeElement;
    fixture.componentRef.setInput('id', '10');
    fixture.detectChanges();

    httpTesting.expectOne(`${API_BASE_URL}/missions/10`).flush(TEST_MISSION);
    httpTesting.expectOne(`${API_BASE_URL}/tdrs`).flush([{ id: 1, missionId: 10, objectifs: [] }]);
    httpTesting.expectOne(`${API_BASE_URL}/declarations-independance`).flush([{ id: 3, missionId: 10, personneId: 2 }]);
    httpTesting.expectOne(`${API_BASE_URL}/reunions`).flush([]);
    httpTesting.expectOne(`${API_BASE_URL}/interviews`).flush([{ id: 9, missionId: 10 }, { id: 8, missionId: 11 }]);
    httpTesting.expectOne(`${API_BASE_URL}/programmes-travail`).flush([TEST_PROGRAMME]);
    httpTesting
      .expectOne(`${API_BASE_URL}/pv-affirmations/mission/10`)
      .flush({ status: 404, message: 'Introuvable' }, { status: 404, statusText: 'Not Found' });
    // Tests are found through the lines of the programme, constats through the tests.
    httpTesting.expectOne(`${API_BASE_URL}/tests`).flush([TEST_AUDIT_TEST, { ...TEST_AUDIT_TEST, id: 41, ligneProgrammeId: 999 }]);
    httpTesting.expectOne(`${API_BASE_URL}/constats`).flush([TEST_CONSTAT, { ...TEST_CONSTAT, id: 61, testId: 999 }]);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  const navigationTexts = (): string[] =>
    Array.from(element.querySelectorAll('.workspace-nav li')).map((item) => item.textContent?.replace(/\s+/g, ' ').trim() ?? '');

  it('should show the mission and the 12 documents of the audit file', () => {
    expect(element.textContent).toContain('Mission n° 005');
    expect(element.querySelector('h1')?.textContent).toContain('Audit de la gestion financière');
    expect(navigationTexts().length).toBe(12);
  });

  it('should give the state of each available document and the step of the others', () => {
    const links = Array.from(element.querySelectorAll('.workspace-nav a'));

    expect(links.length).toBe(9);
    expect(links[1].classList).toContain('workspace-nav-done');
    // One declaration is enough for the document to be done; the hint gives how many were made.
    expect(navigationTexts()[2]).toContain('1');
    expect(links[2].classList).toContain('workspace-nav-done');
    expect(links[3].classList).not.toContain('workspace-nav-done');
    // Only the items of this mission are counted.
    expect(navigationTexts()[4]).toContain('1');
    expect(navigationTexts()[5]).toContain('2');
    expect(navigationTexts()[6]).toContain('1');
    expect(navigationTexts()[7]).toContain('1');
    expect(links[8].classList).not.toContain('workspace-nav-done');
    expect(navigationTexts()[9]).toContain('Étape 20');
  });
});
