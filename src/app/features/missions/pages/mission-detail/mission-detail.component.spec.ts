import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { Mission } from '../../models/mission.model';
import { MissionDetailComponent } from './mission-detail.component';

const MISSION: Mission = {
  id: 10,
  numero: '001',
  intitule: 'Audit de la gestion financière',
  objet: 'Contrôle des procédures comptables.',
  dateDebut: '2026-01-05',
  dateFin: '2026-02-05',
  dateSignature: '2026-01-02',
  structureId: 3,
  structureNom: 'Direction du Budget',
  personnes: [
    { missionPersonneId: 50, personneId: 4, nom: 'Rakoto', prenom: 'Jean', fonction: 'Auditeur', services: null, roles: 'AUDITEUR' },
    { missionPersonneId: 51, personneId: 5, nom: 'Rabe', prenom: 'Aina', fonction: null, services: 'DAI', roles: 'CHEF_MISSION' }
  ]
};

describe('MissionDetailComponent', () => {
  let component: MissionDetailComponent;
  let fixture: ComponentFixture<MissionDetailComponent>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;

  const openTab = (label: string): void => {
    Array.from(element.querySelectorAll<HTMLButtonElement>('[role="tab"]'))
      .find((tab) => tab.textContent?.includes(label))
      ?.click();
    fixture.detectChanges();
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionDetailComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(MissionDetailComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    element = fixture.nativeElement;
    fixture.componentRef.setInput('id', '10');
    fixture.detectChanges();

    httpTesting.expectOne(`${API_BASE_URL}/missions/10`).flush(MISSION);
    httpTesting.expectOne(`${API_BASE_URL}/statistiques/avancement`).flush([
      {
        missionId: 10,
        missionNumero: '001',
        missionIntitule: MISSION.intitule,
        documentsCompletes: 2,
        documentsAttendus: 7,
        pourcentage: 28.6,
        tdr: true,
        programme: true,
        tests: false,
        constats: false,
        rapport: false,
        pvAffirmation: false,
        pvCloture: false
      }
    ]);
    httpTesting
      .expectOne((request) => request.url === `${API_BASE_URL}/documents-generes` && request.params.get('missionId') === '10')
      .flush([
        {
          id: 7,
          documentTypeId: 1,
          documentTypeCode: 'FICHE',
          documentTypeNom: 'Fiche de suivi',
          missionId: 10,
          missionNumero: '001',
          missionIntitule: MISSION.intitule,
          nomFichier: 'fiche.pdf',
          taille: 2048,
          templateVersion: 1,
          dateGeneration: '2026-01-10T10:00:00',
          valeurs: {}
        }
      ]);
    fixture.detectChanges();

    // Lists of the mission form, created with the loaded mission.
    httpTesting.expectOne(`${API_BASE_URL}/structures`).flush([]);
    httpTesting.expectOne(`${API_BASE_URL}/personnes`).flush([]);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should show the mission order', () => {
    expect(element.textContent).toContain('Mission n° 001');
    expect(element.querySelector('h2')?.textContent).toContain('Audit de la gestion financière');
    expect(element.textContent).toContain('Direction du Budget');
    expect(element.textContent).toContain('05/01/2026');
    expect(element.textContent).toContain('Terminée');
  });

  it('should group the team by role, in the order of the hierarchy', () => {
    openTab('Équipe');

    const titles = Array.from(element.querySelectorAll('.mission-section-title')).map((title) => title.textContent?.trim());
    expect(titles).toEqual(['Chef de mission (1)', 'Auditeur (1)']);
  });

  it('should show the progress and the 12 documents of the audit file', () => {
    openTab("Dossier d'audit");

    expect(element.textContent).toContain('2 / 7 · 28.6 %');
    const items = Array.from(element.querySelectorAll('.mission-list-item')).map((item) => item.textContent ?? '');
    expect(items.length).toBe(12);
    expect(items[0]).toContain('Rempli');
    expect(items[1]).toContain('Rempli');
    expect(items[2]).toContain('Disponible');
    expect(items[4]).toContain('À venir');
    expect(items[6]).toContain('À remplir');
  });

  it('should list the generated documents and open one in the history', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    openTab('Documents générés');

    element.querySelector<HTMLButtonElement>('.mission-document')?.click();

    expect(navigate).toHaveBeenCalledWith(['/document-history', 7]);
  });

  it('should save the changes made in the form and tell the list', () => {
    const changed: string[] = [];
    component.missionChanged.subscribe((mission) => changed.push(mission.intitule));

    component.saveMission({
      intitule: 'Audit financier',
      objet: null,
      dateDebut: null,
      dateFin: null,
      dateSignature: null,
      structureId: 3,
      personnes: []
    });
    httpTesting.expectOne(`${API_BASE_URL}/missions/10`).flush({ ...MISSION, intitule: 'Audit financier' });
    fixture.detectChanges();

    expect(changed).toEqual(['Audit financier']);
    expect(element.querySelector('h2')?.textContent).toContain('Audit financier');
  });
});
