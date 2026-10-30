import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute, Router, convertToParamMap, provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { Mission } from '../../models/mission.model';
import { MissionListComponent } from './mission-list.component';

const URL = `${API_BASE_URL}/missions`;

const MISSIONS: Mission[] = [
  {
    id: 10,
    numero: '001',
    intitule: 'Audit de la gestion financière',
    objet: null,
    dateDebut: '2026-01-05',
    dateFin: '2026-02-05',
    dateSignature: null,
    structureId: 3,
    structureNom: 'Direction du Budget',
    personnes: []
  },
  {
    id: 11,
    numero: '002',
    intitule: 'Audit des marchés publics',
    objet: null,
    dateDebut: '2099-01-01',
    dateFin: null,
    dateSignature: null,
    structureId: 4,
    structureNom: 'Autorité de Régulation',
    personnes: []
  }
];

describe('MissionListComponent', () => {
  let component: MissionListComponent;
  let fixture: ComponentFixture<MissionListComponent>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;

  const rowTexts = (): string[] =>
    Array.from(element.querySelectorAll('tbody tr')).map((row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '');

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MissionListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(MissionListComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    element = fixture.nativeElement;
    fixture.detectChanges();

    // Lists of the mission form.
    httpTesting.expectOne(`${API_BASE_URL}/structures`).flush([]);
    httpTesting.expectOne(`${API_BASE_URL}/personnes`).flush([]);
    httpTesting.expectOne(URL).flush(MISSIONS);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should list the missions with their period and status', () => {
    const rows = rowTexts();

    expect(rows.length).toBe(2);
    expect(rows[0]).toContain('001');
    expect(rows[0]).toContain('05/01/2026 → 05/02/2026');
    expect(rows[0]).toContain('Terminée');
    expect(rows[1]).toContain('01/01/2099 → …');
    expect(rows[1]).toContain('À venir');
  });

  it('should search without accents and filter by status', () => {
    component.search.set('regulation');
    fixture.detectChanges();
    expect(rowTexts().length).toBe(1);
    expect(rowTexts()[0]).toContain('002');

    component.search.set('');
    component.statusFilter.set('finished');
    fixture.detectChanges();
    expect(rowTexts().length).toBe(1);
    expect(rowTexts()[0]).toContain('001');
  });

  it('should create a mission, reload the list and open its drawer', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    component.openCreateForm();
    component.saveMission({
      intitule: 'Audit des stocks',
      objet: null,
      dateDebut: null,
      dateFin: null,
      dateSignature: null,
      structureId: 3,
      personnes: []
    });

    const create = httpTesting.expectOne((request) => request.url === URL && request.method === 'POST');
    create.flush({ id: 12, numero: '003', intitule: 'Audit des stocks' });
    fixture.detectChanges();
    httpTesting.expectOne(URL).flush([...MISSIONS, { ...MISSIONS[0], id: 12, numero: '003' }]);

    expect(component.formOpen()).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/missions', 12]);
  });

  it('should delete a mission after confirmation', () => {
    component.askDelete(MISSIONS[1]);
    fixture.detectChanges();
    expect(element.textContent).toContain("Les documents déjà générés restent dans l'historique");

    component.confirmDelete();
    httpTesting.expectOne(`${URL}/11`).flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(rowTexts().length).toBe(1);
  });
});

describe('MissionListComponent opened with ?nouvelle', () => {
  it('should open the creation form, then remove the parameter from the address', async () => {
    await TestBed.configureTestingModule({
      imports: [MissionListComponent],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { queryParamMap: convertToParamMap({ nouvelle: '1' }) } } }
      ]
    }).compileComponents();

    const navigate = spyOn(TestBed.inject(Router), 'navigate');
    const component = TestBed.createComponent(MissionListComponent).componentInstance;

    expect(component.formOpen()).toBeTrue();
    expect(component.editedMission()).toBeNull();
    expect(navigate).toHaveBeenCalledWith([], jasmine.objectContaining({ queryParams: {}, replaceUrl: true }));
  });
});