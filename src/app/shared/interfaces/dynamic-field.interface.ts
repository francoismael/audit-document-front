export type DynamicFieldType = 'TEXT' | 'TEXTAREA' | 'DATE' | 'NUMBER' | 'BOOLEAN';

export interface DynamicField {
  name: string;
  label: string;
  type: DynamicFieldType;
  required: boolean;
  placeholder?: string;
}

export type DynamicFieldValue = string | boolean;

export type DynamicFormValues = Record<string, DynamicFieldValue>;
