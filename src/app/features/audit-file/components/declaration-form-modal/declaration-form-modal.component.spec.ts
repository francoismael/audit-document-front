import { ComponentFixture, TestBed } from '@angular/core/testing';

import { todayAsText } from '../../../missions/models/mission-labels';
import { DeclarationFormModalComponent } from './declaration-form-modal.component';

describe('DeclarationFormModalComponent', () => {
  let component: DeclarationFormModalComponent;
  let fixture: ComponentFixture<DeclarationFormModalComponent>;
  let submitted: string[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DeclarationFormModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DeclarationFormModalComponent);
    component = fixture.componentInstance;
    submitted = [];
    component.submitted.subscribe((date) => submitted.push(date));
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  });

  it('should propose today for a new declaration', () => {
    component.onConfirm();

    expect(submitted).toEqual([todayAsText()]);
  });

  it('should require a date', () => {
    component.dateDeclaration.set('');
    component.onConfirm();
    fixture.detectChanges();

    expect(submitted).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('La date de la déclaration est obligatoire.');
  });
});
