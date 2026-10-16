export type DataTableCellValue =
  | string
  | number
  | boolean
  | null
  | undefined;

export type DataTableRow = Record<string, DataTableCellValue>;

export type DataTableColumnAlign = 'left' | 'center' | 'right';

export interface DataTableColumn {
  key: string;
  label: string;
  align?: DataTableColumnAlign;
}