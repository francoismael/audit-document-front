import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { TEST_MISSION } from '../../testing/audit-file-test-data';
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

    expect(links.length).toBe(4);
    expect(links[1].classList).toContain('workspace-nav-done');
    // One declaration is enough for the document to be done; the hint gives how many were made.
    expect(navigationTexts()[2]).toContain('1');
    expect(links[2].classList).toContain('workspace-nav-done');
    expect(links[3].classList).not.toContain('workspace-nav-done');
    expect(navigationTexts()[4]).toContain('Étape 15');
  });
});
