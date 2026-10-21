import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DataTableCellDirective } from './data-table-cell.directive';
import { DataTableComponent } from './data-table.component';
import { DataTableColumn, DataTableRow } from './data-table.interface';

@Component({
  standalone: true,
  imports: [DataTableComponent, DataTableCellDirective],
  template: `
    <app-data-table [columns]="columns" [rows]="rows">
      <ng-template appDataTableCell="actif" let-row>
        <span class="custom-cell">{{ row['actif'] ? 'Actif' : 'Inactif' }}</span>
      </ng-template>
    </app-data-table>
  `
})
class HostComponent {
  columns: DataTableColumn[] = [
    { key: 'nom', label: 'Nom' },
    { key: 'description', label: 'Description' },
    { key: 'actif', label: 'Statut' }
  ];

  rows: DataTableRow[] = [
    { nom: 'Fiche de suivi', description: null, actif: true },
    { nom: 'Rapport', description: 'Rapport annuel', actif: false }
  ];
}

describe('DataTableComponent', () => {
  let fixture: ComponentFixture<HostComponent>;
  let element: HTMLElement;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [HostComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(HostComponent);
    element = fixture.nativeElement;
    fixture.detectChanges();
  });

  const cells = (): string[][] =>
    Array.from(element.querySelectorAll('tbody tr')).map((row) =>
      Array.from(row.querySelectorAll('td')).map((cell) => cell.textContent?.trim() ?? '')
    );

  it('should render plain values, a dash for empty ones, and the custom templates', () => {
    expect(cells()).toEqual([
      ['Fiche de suivi', '—', 'Actif'],
      ['Rapport', 'Rapport annuel', 'Inactif']
    ]);
    expect(element.querySelectorAll('.custom-cell').length).toBe(2);
  });

  it('should show the empty message when there is no row', () => {
    fixture.componentInstance.rows = [];
    fixture.changeDetectorRef.markForCheck();
    fixture.detectChanges();

    expect(element.textContent).toContain('Aucune donnée disponible.');
  });
});
