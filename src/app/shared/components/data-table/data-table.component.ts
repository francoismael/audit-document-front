import { NgTemplateOutlet } from '@angular/common';
import { Component, TemplateRef, computed, contentChildren, input } from '@angular/core';

import { DataTableCellContext, DataTableCellDirective } from './data-table-cell.directive';
import {
  DataTableCellValue,
  DataTableColumn,
  DataTableRow
} from './data-table.interface';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [NgTemplateOutlet],
  templateUrl: './data-table.component.html',
  styleUrl: './data-table.component.scss'
})
export class DataTableComponent {
  readonly columns = input.required<DataTableColumn[]>();
  readonly rows = input.required<DataTableRow[]>();

  readonly emptyMessage = input<string>(
    'Aucune donnée disponible.'
  );

  private readonly cellDirectives = contentChildren(DataTableCellDirective);

  private readonly cellTemplates = computed(() => {
    const templates = new Map<string, TemplateRef<DataTableCellContext>>();

    for (const directive of this.cellDirectives()) {
      templates.set(directive.column(), directive.template);
    }

    return templates;
  });

  cellTemplate(column: DataTableColumn): TemplateRef<DataTableCellContext> | null {
    return this.cellTemplates().get(column.key) ?? null;
  }

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
