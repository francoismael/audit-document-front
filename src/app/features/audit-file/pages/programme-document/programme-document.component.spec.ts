import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { AuditFileStore } from '../../services/audit-file.store';
import { TEST_MISSION, TEST_PROGRAMME, TEST_TDR } from '../../testing/audit-file-test-data';
import { ProgrammeDocumentComponent } from './programme-document.component';

describe('ProgrammeDocumentComponent', () => {
  let component: ProgrammeDocumentComponent;
  let fixture: ComponentFixture<ProgrammeDocumentComponent>;
  let httpTesting: HttpTestingController;
  let store: AuditFileStore;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ProgrammeDocumentComponent],
      providers: [AuditFileStore, provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    store = TestBed.inject(AuditFileStore);
    store.mission.set(TEST_MISSION);
    httpTesting = TestBed.inject(HttpTestingController);
    fixture = TestBed.createComponent(ProgrammeDocumentComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should send to the TDR while it has no objective', () => {
    fixture.detectChanges();

    expect(element.textContent).toContain("rédigez d'abord les termes de référence");
  });

  it('should print the lines grouped by objective, in the order of the TDR, on a landscape sheet', () => {
    store.tdr.set(TEST_TDR);
    store.programme.set(TEST_PROGRAMME);
    fixture.detectChanges();

    const rows = component.rows();
    expect(rows.map((row) => row.ligne.numeroControle)).toEqual(['C-01', 'C-02']);
    expect(rows.map((row) => row.objectifRowspan)).toEqual([1, 1]);
    expect(element.querySelector('.document-sheet-landscape')).not.toBeNull();
    expect(element.querySelector('.programme-table')?.textContent).toContain('T05 - Enregistrement sous Excel');
  });

  it('should require an objective on each line, then save the lines keeping their ids', () => {
    store.tdr.set(TEST_TDR);
    store.programme.set(TEST_PROGRAMME);
    fixture.detectChanges();

    component.startEditing();
    component.addLigne();
    component.updateLigne(2, 'objectifId', '');
    component.save();
    expect(component.lignesError()).toContain('rattachée à un objectif');

    component.updateLigne(2, 'objectifId', '7');
    component.updateLigne(2, 'tacheOperation', ' T07 - Archivage ');
    component.save();

    const request = httpTesting.expectOne(`${API_BASE_URL}/programmes-travail/20`);
    expect(request.request.method).toBe('PUT');
    expect(request.request.body.lignes.map((ligne: { id: number | null }) => ligne.id)).toEqual([31, 30, null]);
    expect(request.request.body.lignes[2].tacheOperation).toBe('T07 - Archivage');
    expect(request.request.body.lignes[2].faiblesseAConfirmer).toBeNull();
    request.flush(TEST_PROGRAMME);

    expect(component.editing()).toBeFalse();
  });
});
