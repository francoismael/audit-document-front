import { Component, input } from '@angular/core';
import {
  DataTableCellValue,
  DataTableColumn,
  DataTableRow
} from './data-table.interface';

@Component({
  selector: 'app-data-table',
  standalone: true,
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent {
  readonly columns = input.required<DataTableColumn[]>();
  readonly rows = input.required<DataTableRow[]>();

  readonly emptyMessage = input<string>(
    'Aucune donnée disponible.'
  );

  formatCell(value: DataTableCellValue): string {
    if (value === null || value === undefined || value === '') {
      return '—';
    }

    if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non';
    }

    return String(value);
  }

  getColumnAlign(
    column: DataTableColumn
  ): 'left' | 'center' | 'right' {
    return column.align ?? 'left';
  }
}