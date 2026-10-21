import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentType, DocumentTypeRequest } from '../../models/document-type.model';
import { DocumentTypeFormModalComponent } from './document-type-form-modal.component';

const DOCUMENT_TYPE: DocumentType = {
  id: 1,
  code: 'FICHE_SUIVI',
  nom: 'Fiche de suivi',
  description: 'Suivi des recommandations.',
  actif: true,
  dateCreation: '2026-10-07T08:06:13'
};

describe('DocumentTypeFormModalComponent', () => {
  let component: DocumentTypeFormModalComponent;
  let fixture: ComponentFixture<DocumentTypeFormModalComponent>;
  let element: HTMLElement;
  let submitted: DocumentTypeRequest[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentTypeFormModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentTypeFormModalComponent);
    component = fixture.componentInstance;
    element = fixture.nativeElement;
    submitted = [];
    component.submitted.subscribe((request) => submitted.push(request));
  });

  const open = (documentType: DocumentType | null): void => {
    fixture.componentRef.setInput('documentType', documentType);
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  };

  it('should stay hidden while closed', () => {
    fixture.detectChanges();

    expect(element.querySelector('[role="dialog"]')).toBeNull();
  });

  it('should open empty to create a type', () => {
    open(null);

    expect(element.textContent).toContain('Créer un type de document');
    expect(element.querySelector<HTMLInputElement>('#document-type-code')?.value).toBe('');
  });

  it('should open prefilled to edit a type', () => {
    open(DOCUMENT_TYPE);

    expect(element.textContent).toContain('Modifier le type de document');
    expect(element.querySelector<HTMLInputElement>('#document-type-code')?.value).toBe('FICHE_SUIVI');
    expect(element.querySelector<HTMLInputElement>('#document-type-nom')?.value).toBe('Fiche de suivi');
  });

  it('should block an empty or invalid form', () => {
    open(null);

    component.onConfirm();
    fixture.detectChanges();
    expect(submitted).toEqual([]);
    expect(element.textContent).toContain('Le code est obligatoire.');
    expect(element.textContent).toContain('Le nom est obligatoire.');

    component.code.set('FICHE SUIVI');
    component.nom.set('Fiche');
    component.onConfirm();
    fixture.detectChanges();
    expect(submitted).toEqual([]);
    expect(element.textContent).toContain('sans espace');
  });

  it('should submit trimmed values, with an empty description sent as null', () => {
    open(null);

    component.code.set('  fiche_suivi ');
    component.nom.set(' Fiche de suivi ');
    component.description.set('   ');
    component.onConfirm();

    expect(submitted).toEqual([{ code: 'fiche_suivi', nom: 'Fiche de suivi', description: null }]);
  });

  it('should start clean when it is opened again', () => {
    open(null);
    component.code.set('BROUILLON');
    component.onConfirm();

    fixture.componentRef.setInput('open', false);
    fixture.detectChanges();
    open(null);

    expect(component.code()).toBe('');
    expect(component.showErrors()).toBeFalse();
  });
});
