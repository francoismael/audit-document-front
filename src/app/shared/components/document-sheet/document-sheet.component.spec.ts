import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DocumentSheetComponent } from './document-sheet.component';

describe('DocumentSheetComponent', () => {
  let fixture: ComponentFixture<DocumentSheetComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentSheetComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentSheetComponent);
    element = fixture.nativeElement;
  });

  it('should show the official header and the reference', () => {
    fixture.componentRef.setInput('reference', 'Antananarivo, le 22/10/2026');
    fixture.detectChanges();

    expect(element.textContent).toContain("MINISTÈRE DE L'ÉCONOMIE ET DES FINANCES");
    expect(element.textContent).toContain("DIRECTION DE L'AUDIT INTERNE");
    expect(element.querySelector('.document-sheet-reference')?.textContent).toContain('Antananarivo, le 22/10/2026');
  });
});
