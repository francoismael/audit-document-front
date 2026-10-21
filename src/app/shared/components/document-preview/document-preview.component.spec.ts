import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DynamicField } from '../../interfaces/dynamic-field.interface';
import { DocumentPreviewComponent } from './document-preview.component';

const FIELDS: DynamicField[] = [
  { name: 'motifs', label: 'Motifs', type: 'TEXTAREA', required: true },
  { name: 'nature', label: 'Nature', type: 'TEXT', required: false },
  { name: 'dateEmission', label: 'Date d\'émission', type: 'DATE', required: true },
  { name: 'urgent', label: 'Urgent', type: 'BOOLEAN', required: false }
];

describe('DocumentPreviewComponent', () => {
  let fixture: ComponentFixture<DocumentPreviewComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DocumentPreviewComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(DocumentPreviewComponent);
    element = fixture.nativeElement;
    fixture.componentRef.setInput('title', 'Fiche de suivi');
    fixture.componentRef.setInput('fields', FIELDS);
    fixture.componentRef.setInput('values', {
      motifs: 'Contrôle annuel',
      nature: '',
      dateEmission: '2026-10-20',
      urgent: false
    });
  });

  const rows = (): string[][] =>
    Array.from(element.querySelectorAll('.document-preview-row')).map((row) => [
      row.querySelector('dt')?.textContent?.trim() ?? '',
      row.querySelector('dd')?.textContent?.trim() ?? ''
    ]);

  it('should format each value for reading', () => {
    fixture.detectChanges();

    expect(rows()).toEqual([
      ['Motifs', 'Contrôle annuel'],
      ['Nature', '—'],
      ['Date d\'émission', '20/10/2026'],
      ['Urgent', 'Non']
    ]);
  });

  it('should show the extra rows before the fields', () => {
    fixture.componentRef.setInput('extraRows', [{ label: 'Mission associée', value: '001 — Audit' }]);
    fixture.detectChanges();

    expect(rows()[0]).toEqual(['Mission associée', '001 — Audit']);
    expect(rows().length).toBe(5);
  });
});
