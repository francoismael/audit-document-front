import { Directive, TemplateRef, inject, input } from '@angular/core';

import { DataTableRow } from './data-table.interface';

export interface DataTableCellContext {
  $implicit: DataTableRow;
}

// Custom content for one column: <ng-template appDataTableCell="status" let-row>…</ng-template>
@Directive({
  selector: 'ng-template[appDataTableCell]',
  standalone: true
})
export class DataTableCellDirective {
  readonly column = input.required<string>({ alias: 'appDataTableCell' });

  readonly template = inject<TemplateRef<DataTableCellContext>>(TemplateRef);

  static ngTemplateContextGuard(
    directive: DataTableCellDirective,
    context: unknown
  ): context is DataTableCellContext {
    return true;
  }
}
