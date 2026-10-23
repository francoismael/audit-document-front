import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { DeclarationIndependance } from '../../models/declaration-independance.model';
import { AuditFileStore } from '../../services/audit-file.store';
import { TEST_MISSION } from '../../testing/audit-file-test-data';
import { DeclarationsDocumentComponent } from './declarations-document.component';

const DECLARATION: DeclarationIndependance = {
  id: 30,
  missionId: 10,
  missionNumero: '005',
  missionIntitule: TEST_MISSION.intitule,
  personneId: 2,
  nom: 'Rabe',
  prenom: 'Aina',
  matricule: '123456',
  fonction: 'Chef de service',
  service: 'DAI',
  dateDeclaration: '2026-11-02'
};

describe('DeclarationsDocumentComponent', () => {
  let component: DeclarationsDocumentComponent;
  let fixture: ComponentFixture<DeclarationsDocumentComponent>;
  let httpTesting: HttpTestingController;
  let store: AuditFileStore;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeclarationsDocumentComponent],
      providers: [AuditFileStore, provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    store = TestBed.inject(AuditFileStore);
    store.mission.set(TEST_MISSION);
    store.declarations.set([DECLARATION]);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(DeclarationsDocumentComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should list each member of the audit team once, without the point focal', () => {
    const names = Array.from(element.querySelectorAll('.declarations-name')).map((name) => name.textContent?.trim());

    expect(names).toEqual(['Rakoto Jean', 'Rabe Aina', 'Rasoa Lova', 'Randria Hery']);
    expect(element.textContent).toContain('1 déclaration(s) établie(s)');
    expect(element.textContent).toContain('Signée le 02/11/2026');
  });

  it('should show the letter of the selected member, with the mission', () => {
    component.select(component.declarants()[1]);
    fixture.detectChanges();

    const letter = element.querySelector('app-document-sheet')?.textContent?.replace(/\s+/g, ' ') ?? '';
    expect(letter).toContain("Lettre de déclaration d'indépendance");
    expect(letter).toContain('123456');
    expect(letter).toContain('pour la mission n° 005 « Audit de la gestion financière »');
    expect(letter).toContain('Antananarivo, le 02/11/2026');
  });

  it('should establish the declaration of a member', () => {
    component.openForm(component.declarants()[3]);
    component.saveDeclaration('2026-11-03');

    const request = httpTesting.expectOne(`${API_BASE_URL}/declarations-independance`);
    expect(request.request.body).toEqual({ missionId: 10, personneId: 4, dateDeclaration: '2026-11-03' });
    request.flush({ ...DECLARATION, id: 31, personneId: 4, nom: 'Randria', prenom: 'Hery', dateDeclaration: '2026-11-03' });

    expect(store.declarations().length).toBe(2);
    expect(component.formFor()).toBeNull();
  });

  it('should delete a declaration after confirmation', () => {
    component.deletionFor.set(component.declarants()[1]);
    component.confirmDeletion();
    httpTesting.expectOne(`${API_BASE_URL}/declarations-independance/30`).flush(null, { status: 204, statusText: 'No Content' });

    expect(store.declarations()).toEqual([]);
  });
});
