import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentField, DocumentFieldRequest } from '../../models/document-field.model';
import { DocumentFieldFormModalComponent } from './document-field-form-modal.component';

const FIELD: DocumentField = {
  id: 4,
  documentTypeId: 1,
  documentTypeNom: 'Fiche de suivi',
  nom: 'date_debut',
  libelle: 'Date de début',
  type: 'DATE',
  obligatoire: true,
  ordre: 2
};

describe('DocumentFieldFormModalComponent', () => {
  let component: DocumentFieldFormModalComponent;
  let fixture: ComponentFixture<DocumentFieldFormModalComponent>;
  let element: HTMLElement;
  let submitted: DocumentFieldRequest[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentFieldFormModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentFieldFormModalComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    submitted = [];
    component.submitted.subscribe((request) => submitted.push(request));
    fixture.componentRef.setInput('documentTypeId', 1);
  });

  const open = (field: DocumentField | null, takenNames: string[] = []): void => {
    fixture.componentRef.setInput('field', field);
    fixture.componentRef.setInput('takenNames', takenNames);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  };

  it('should open prefilled to edit a field', () => {
    open(FIELD);

    expect(element.textContent).toContain('Modifier le champ');
    expect(element.querySelector<HTMLInputElement>('#document-field-nom')?.value).toBe('date_debut');
    expect(element.querySelector<HTMLSelectElement>('#document-field-type')?.value).toBe('DATE');
    expect(element.querySelector<HTMLInputElement>('#document-field-obligatoire')?.checked).toBeTrue();
    expect(element.textContent).toContain('{{ date_debut }}');
  });

  it('should block an empty form, then an invalid or already used name', () => {
    open(null, ['objet']);

    component.onConfirm();
    fixture.detectChanges();
    expect(submitted).toEqual([]);
    expect(element.textContent).toContain('Le nom technique est obligatoire.');
    expect(element.textContent).toContain('Le libellé est obligatoire.');
    expect(element.textContent).toContain('Choisissez le type du champ.');

    component.libelle.set('Objet');
    component.type.set('TEXT');
    component.nom.set('date début');
    component.onConfirm();
    fixture.detectChanges();
    expect(element.textContent).toContain('sans espace ni accent');

    component.nom.set('OBJET');
    component.onConfirm();
    fixture.detectChanges();
    expect(submitted).toEqual([]);
    expect(element.textContent).toContain('Un autre champ porte déjà ce nom.');
  });

  it('should submit trimmed values for the document type', () => {
    open(null);

    component.nom.set(' objet_mission ');
    component.libelle.set(' Objet de la mission ');
    component.type.set('TEXTAREA');
    component.obligatoire.set(true);
    component.onConfirm();

    expect(submitted).toEqual([
      { documentTypeId: 1, nom: 'objet_mission', libelle: 'Objet de la mission', type: 'TEXTAREA', obligatoire: true }
    ]);
  });
});
