import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { Mission, MissionRequest } from '../../models/mission.model';
import { MissionFormModalComponent } from './mission-form-modal.component';

const MISSION: Mission = {
  id: 10,
  numero: '001',
  intitule: 'Audit des marchés',
  objet: 'Contrôle des procédures',
  dateDebut: '2026-11-01',
  dateFin: '2026-11-30',
  dateSignature: null,
  structureId: 3,
  structureNom: 'Direction du Budget',
  personnes: [
    {
      missionPersonneId: 50,
      personneId: 4,
      nom: 'Rakoto',
      prenom: 'Jean',
      fonction: 'Auditeur',
      services: null,
      roles: 'CHEF_MISSION'
    }
  ]
};

describe('MissionFormModalComponent', () => {
  let component: MissionFormModalComponent;
  let fixture: ComponentFixture<MissionFormModalComponent>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;
  let submitted: MissionRequest[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionFormModalComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(MissionFormModalComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    element = fixture.nativeElement;
    submitted = [];
    component.submitted.subscribe((request) => submitted.push(request));

    httpTesting.expectOne(`${API_BASE_URL}/structures`).flush([{ id: 3, nom: 'Direction du Budget', descriptions: null }]);
    httpTesting.expectOne(`${API_BASE_URL}/personnes`).flush([
      { id: 4, nom: 'Rakoto', prenom: 'Jean', matricule: null, fonction: 'Auditeur', services: null },
      { id: 5, nom: 'Rabe', prenom: 'Aina', matricule: null, fonction: null, services: null }
    ]);
  });

  afterEach(() => {
    httpTesting.verify();
  });

  const open = (mission: Mission | null): void => {
    fixture.componentRef.setInput('mission', mission);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  };

  it('should open prefilled to edit a mission, with its team', () => {
    open(MISSION);

    expect(element.textContent).toContain('Modifier la mission n° 001');
    expect(element.querySelector<HTMLInputElement>('#mission-intitule')?.value).toBe('Audit des marchés');
    expect(element.querySelector<HTMLSelectElement>('#mission-structure')?.value).toBe('3');
    expect(element.querySelector('.mission-form-team')?.textContent).toContain('Chef de mission');
  });

  it('should block a mission without intitule or structure, or with dates in the wrong order', () => {
    open(null);
    component.onConfirm();
    fixture.detectChanges();

    expect(element.textContent).toContain("L'intitulé est obligatoire.");
    expect(element.textContent).toContain('Choisissez la structure auditée.');

    component.intitule.set('Audit');
    component.structureId.set('3');
    component.dateDebut.set('2026-11-30');
    component.dateFin.set('2026-11-01');
    component.onConfirm();
    fixture.detectChanges();

    expect(element.textContent).toContain('La date de fin doit être après la date de début.');
    expect(submitted).toEqual([]);
  });

  it('should add team members once per role and send the request', () => {
    open(null);
    component.intitule.set(' Audit des marchés ');
    component.structureId.set('3');

    component.addMember();
    expect(component.memberError()).toBe('Choisissez une personne et son rôle.');

    component.newMemberId.set('5');
    component.newMemberRole.set('POINT_FOCAL');
    component.addMember();
    component.newMemberId.set('5');
    component.addMember();
    expect(component.memberError()).toBe('Cette personne a déjà ce rôle dans la mission.');

    component.onConfirm();

    expect(submitted).toEqual([
      {
        intitule: 'Audit des marchés',
        objet: null,
        dateDebut: null,
        dateFin: null,
        dateSignature: null,
        structureId: 3,
        personnes: [{ personneId: 5, roles: 'POINT_FOCAL' }]
      }
    ]);
  });

  it('should select a structure created on the fly', () => {
    open(null);

    component.createStructure({ nom: 'Direction des Impôts', descriptions: null });
    httpTesting.expectOne(`${API_BASE_URL}/structures`).flush({ id: 9, nom: 'Direction des Impôts', descriptions: null });

    expect(component.structureId()).toBe('9');
    expect(component.structureOptions().map((option) => option.label)).toContain('Direction des Impôts');
  });

  it('should add a person created on the fly to the team when a role is chosen', () => {
    open(null);
    component.newMemberRole.set('AUDITEUR');

    component.createPersonne({ nom: 'Rasoa', prenom: 'Lova', matricule: null, fonction: null, services: null });
    httpTesting
      .expectOne(`${API_BASE_URL}/personnes`)
      .flush({ id: 12, nom: 'Rasoa', prenom: 'Lova', matricule: null, fonction: null, services: null });

    expect(component.team()).toEqual([{ personneId: 12, roles: 'AUDITEUR' }]);
  });
});
