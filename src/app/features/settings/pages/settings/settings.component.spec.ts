import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { AppSettings } from '../../models/app-settings.model';
import { SettingsComponent } from './settings.component';

const SETTINGS: AppSettings = {
  nomApplication: 'audit-document',
  dossierModeles: 'storage/templates',
  dossierDocumentsGeneres: 'storage/generated',
  tailleMaxFichier: '10MB',
  formatsModeles: ['.docx'],
  formatsGeneration: ['PDF'],
  syntaxeVariables: '{{nomDuChamp}}',
  typesChamps: ['TEXT', 'DATE'],
  rolesMission: ['CHEF_MISSION', 'POINT_FOCAL']
};

describe('SettingsComponent', () => {
  let fixture: ComponentFixture<SettingsComponent>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SettingsComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()]
    }).compileComponents();

    fixture = TestBed.createComponent(SettingsComponent);
    element = fixture.nativeElement;
    httpTesting = TestBed.inject(HttpTestingController);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  it('should show the settings with readable names for the field types and the roles', () => {
    httpTesting.expectOne(`${API_BASE_URL}/parametres`).flush(SETTINGS);
    fixture.detectChanges();

    const text = element.textContent?.replace(/\s+/g, ' ') ?? '';
    expect(text).toContain('storage/templates');
    expect(text).toContain('10MB');
    expect(text).toContain('{{nomDuChamp}}');
    expect(text).toContain('lecture seule');

    const chips = Array.from(element.querySelectorAll('.settings-chips li')).map((chip) =>
      Array.from(chip.children).map((part) => part.textContent?.trim()).join(' ')
    );
    expect(chips).toEqual(['Texte court TEXT', 'Date DATE', 'Chef de mission CHEF_MISSION', 'Point focal (entité auditée) POINT_FOCAL']);
  });

  it('should offer to try again when the settings cannot be loaded', async () => {
    httpTesting
      .expectOne(`${API_BASE_URL}/parametres`)
      .flush({ status: 500, message: 'Erreur du serveur' }, { status: 500, statusText: 'Server Error' });
    // The message of the API is read asynchronously.
    await fixture.whenStable();
    fixture.detectChanges();

    expect(element.textContent).toContain('Impossible de charger les paramètres');
  });
});
