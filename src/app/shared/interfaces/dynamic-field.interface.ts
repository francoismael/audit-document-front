export type DynamicFieldType = 'TEXT' | 'TEXTAREA' | 'DATE' | 'NUMBER' | 'BOOLEAN';

export const DYNAMIC_FIELD_TYPE_LABELS: Record<DynamicFieldType, string> = {
  TEXT: 'Texte court',
  TEXTAREA: 'Texte long',
  DATE: 'Date',
  NUMBER: 'Nombre',
  BOOLEAN: 'Oui / Non'
};

export interface DynamicField {
  name: string;
  label: string;
  type: DynamicFieldType;
  required: boolean;
  placeholder?: string;
}

export type DynamicFieldValue = string | boolean;

export type DynamicFormValues = Record<string, DynamicFieldValue>;
