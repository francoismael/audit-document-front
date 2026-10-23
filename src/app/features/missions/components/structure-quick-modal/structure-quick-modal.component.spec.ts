import { ComponentFixture, TestBed } from '@angular/core/testing';

import { StructureRequest } from '../../models/structure.model';
import { StructureQuickModalComponent } from './structure-quick-modal.component';

describe('StructureQuickModalComponent', () => {
  let component: StructureQuickModalComponent;
  let fixture: ComponentFixture<StructureQuickModalComponent>;
  let submitted: StructureRequest[];

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [StructureQuickModalComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(StructureQuickModalComponent);
    component = fixture.componentInstance;
    submitted = [];
    component.submitted.subscribe((request) => submitted.push(request));
    fixture.componentRef.setInput('open', true);
    fixture.detectChanges();
  });

  it('should require a name, then send trimmed values', () => {
    component.onConfirm();
    fixture.detectChanges();
    expect(fixture.nativeElement.textContent).toContain('Le nom de la structure est obligatoire.');

    component.nom.set('  Direction du Budget ');
    component.descriptions.set('  ');
    component.onConfirm();

    expect(submitted).toEqual([{ nom: 'Direction du Budget', descriptions: null }]);
  });
});
