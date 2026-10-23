import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PersonneRequest } from '../../models/personne.model';
import { PersonneQuickModalComponent } from './personne-quick-modal.component';

describe('PersonneQuickModalComponent', () => {
  let component: PersonneQuickModalComponent;
  let fixture: ComponentFixture<PersonneQuickModalComponent>;
  let submitted: PersonneRequest[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PersonneQuickModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(PersonneQuickModalComponent);
    component = fixture.componentInstance;
    submitted = [];
    component.submitted.subscribe((request) => submitted.push(request));
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  });

  it('should require the name and the first name, then send trimmed values', () => {
    component.onConfirm();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Le nom est obligatoire.');
    expect(fixture.nativeElement.textContent).toContain('Le prénom est obligatoire.');

    component.nom.set(' Rakoto ');
    component.prenom.set('Jean');
    component.fonction.set(' Auditeur ');
    component.onConfirm();

    expect(submitted).toEqual([
      { nom: 'Rakoto', prenom: 'Jean', matricule: null, fonction: 'Auditeur', services: null }
    ]);
  });
});
