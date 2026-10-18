import { SelectFieldOption } from '../components/select-field/select-field.interface';

export type DynamicFieldType = 'TEXT' | 'TEXTAREA' | 'NUMBER' | 'EMAIL' | 'DATE' | 'SELECT' | 'CHECKBOX';

export interface DynamicField {
  name: string;
  label: string;
  type: DynamicFieldType;
  required: boolean;
  placeholder?: string;
  options?: SelectFieldOption[];
}

export type DynamicFieldValue = string | boolean;

export type DynamicFormValues = Record<string, DynamicFieldValue>;
