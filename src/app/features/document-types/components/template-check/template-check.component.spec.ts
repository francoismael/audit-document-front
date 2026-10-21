import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TemplateValidation } from '../../models/document-template.model';
import { TemplateCheckComponent } from './template-check.component';

const VALIDATION: TemplateValidation = {
  documentTypeId: 1,
  templateId: 2,
  templateName: 'fiche.docx',
  variablesInTemplate: ['objet', 'lieu'],
  fieldsInDatabase: ['objet', 'date_debut'],
  missingFields: ['date_debut'],
  unknownVariables: ['lieu'],
  valid: false
};

describe('TemplateCheckComponent', () => {
  let fixture: ComponentFixture<TemplateCheckComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [TemplateCheckComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(TemplateCheckComponent);
    element = fixture.nativeElement;
  });

  it('should list the mismatches of an invalid template', () => {
    fixture.componentRef.setInput('validation', VALIDATION);
    fixture.detectChanges();

    expect(element.textContent).toContain('Modèle invalide');
    expect(element.textContent).toContain('Champs absents du modèle');
    expect(element.textContent).toContain('{{ date_debut }}');
    expect(element.textContent).toContain('Variables sans champ');
    expect(element.textContent).toContain('{{ lieu }}');
  });

  it('should only show the detected variables of a valid template', () => {
    fixture.componentRef.setInput('validation', {
      ...VALIDATION,
      missingFields: [],
      unknownVariables: [],
      valid: true
    });
    fixture.detectChanges();

    expect(element.textContent).toContain('Modèle valide');
    expect(element.textContent).not.toContain('Champs absents du modèle');
    expect(element.textContent).toContain('Variables détectées dans le modèle (2)');
  });
});
