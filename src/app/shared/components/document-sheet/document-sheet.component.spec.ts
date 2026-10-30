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
    expect(element.querySelector('.document-sheet-heading')).toBeNull();
    expect(element.querySelector('img')?.getAttribute('alt')).toBe("Logo du Ministère de l'Économie et des Finances");
  });

  it('should write the title first, then the logo of the Republic, then the Ministry', () => {
    fixture.componentRef.setInput('heading', "Procès-verbal de réunion d'ouverture");
    fixture.componentRef.setInput('logo', 'republique');
    fixture.detectChanges();

    const header = Array.from(element.querySelector('.document-sheet-header')?.children ?? []).map((child) => child.tagName);
    expect(header).toEqual(['H1', 'IMG', 'P', 'P']);
    expect(element.querySelector('img')?.getAttribute('alt')).toBe('Logo de la République de Madagascar');
  });
});
