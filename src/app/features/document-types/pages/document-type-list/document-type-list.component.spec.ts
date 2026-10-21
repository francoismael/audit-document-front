import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';

import { API_BASE_URL } from '../../../../core/http/api.config';
import { ToastService } from '../../../../core/services/toast.service';
import { DocumentType } from '../../models/document-type.model';
import { DocumentTypeListComponent } from './document-type-list.component';

const URL = `${API_BASE_URL}/document-types`;

const DOCUMENT_TYPES: DocumentType[] = [
  { id: 1, code: 'FICHE_SUIVI', nom: 'Fiche de suivi', description: 'Suivi.', actif: true, dateCreation: '2026-10-07T08:06:13' },
  { id: 2, code: 'ANCIEN', nom: 'Ancien modèle', description: null, actif: false, dateCreation: '2026-09-01T10:00:00' }
];

async function waitUntil(condition: () => boolean, timeoutMs = 2000): Promise<void> {
  const start = Date.now();

  while (!condition()) {
    if (Date.now() - start > timeoutMs) {
      throw new Error('Condition not met in time');
    }

    await new Promise((resolve) => setTimeout(resolve, 10));
  }
}

describe('DocumentTypeListComponent', () => {
  let component: DocumentTypeListComponent;
  let fixture: ComponentFixture<DocumentTypeListComponent>;
  let httpTesting: HttpTestingController;
  let element: HTMLElement;
  let toasts: ToastService;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentTypeListComponent],
      providers: [provideHttpClient(), provideHttpClientTesting(), provideRouter([])]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentTypeListComponent);
    component = fixture.componentInstance;
    httpTesting = TestBed.inject(HttpTestingController);
    toasts = TestBed.inject(ToastService);
    element = fixture.nativeElement;
    fixture.detectChanges();

    httpTesting.expectOne(URL).flush(DOCUMENT_TYPES);
    fixture.detectChanges();
  });

  afterEach(() => {
    httpTesting.verify();
  });

  const rowTexts = (): string[] =>
    Array.from(element.querySelectorAll('tbody tr')).map((row) => row.textContent?.replace(/\s+/g, ' ').trim() ?? '');

  it('should list the types with their status, date and actions', () => {
    const rows = rowTexts();

    expect(rows.length).toBe(2);
    expect(rows[0]).toContain('Fiche de suivi');
    expect(rows[0]).toContain('07/10/2026');
    expect(rows[0]).toContain('Actif');
    expect(rows[1]).toContain('Inactif');

    const actionLabels = (rowIndex: number): string[] =>
      Array.from(element.querySelectorAll('tbody tr')[rowIndex].querySelectorAll('app-icon-button button')).map(
        (button) => button.getAttribute('aria-label') ?? ''
      );

    expect(actionLabels(0)).toEqual(['Configurer le modèle et les champs', 'Modifier', 'Désactiver', 'Supprimer']);
    expect(actionLabels(1)).toContain('Activer');
  });

  it('should create a type and open its configuration', () => {
    const navigate = spyOn(TestBed.inject(Router), 'navigate');

    component.openCreateForm();
    component.saveDocumentType({ code: 'RAPPORT', nom: 'Rapport', description: null });

    const request = httpTesting.expectOne(URL);
    expect(request.request.method).toBe('POST');
    request.flush({ ...DOCUMENT_TYPES[0], id: 3, code: 'RAPPORT', nom: 'Rapport' });

    expect(component.formOpen()).toBeFalse();
    expect(navigate).toHaveBeenCalledWith(['/document-types', 3]);
  });

  it('should update an edited type in the list', () => {
    component.openEditForm(DOCUMENT_TYPES[0]);
    component.saveDocumentType({ code: 'FICHE_SUIVI', nom: 'Fiche de suivi v2', description: null });

    httpTesting.expectOne(`${URL}/1`).flush({ ...DOCUMENT_TYPES[0], nom: 'Fiche de suivi v2' });
    fixture.detectChanges();

    expect(rowTexts()[0]).toContain('Fiche de suivi v2');
  });

  it('should switch the status of a type', () => {
    component.toggleStatus(DOCUMENT_TYPES[0]);

    const request = httpTesting.expectOne(`${URL}/1/statut`);
    expect(request.request.body).toEqual({ actif: false });
    request.flush({ ...DOCUMENT_TYPES[0], actif: false });
    fixture.detectChanges();

    expect(rowTexts()[0]).toContain('Inactif');
  });

  it('should delete a type after confirmation', () => {
    component.askDelete(DOCUMENT_TYPES[1]);
    fixture.detectChanges();
    expect(element.textContent).toContain('sera supprimé avec ses champs');

    component.confirmDelete();
    httpTesting.expectOne(`${URL}/2`).flush(null, { status: 204, statusText: 'No Content' });
    fixture.detectChanges();

    expect(rowTexts().length).toBe(1);
    expect(component.typeToDelete()).toBeNull();
  });

  it('should keep a used type and show the backend message when the deletion is refused', async () => {
    const error = spyOn(toasts, 'error');

    component.askDelete(DOCUMENT_TYPES[0]);
    component.confirmDelete();
    httpTesting.expectOne(`${URL}/1`).flush(
      { status: 409, message: 'Ce type a déjà servi à générer 2 document(s). Désactivez-le plutôt que de le supprimer.' },
      { status: 409, statusText: 'Conflict' }
    );

    await waitUntil(() => error.calls.count() > 0);
    fixture.detectChanges();

    expect(error).toHaveBeenCalledWith('Ce type a déjà servi à générer 2 document(s). Désactivez-le plutôt que de le supprimer.');
    expect(rowTexts().length).toBe(2);
    expect(component.typeToDelete()).toBeNull();
  });
});
