
export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'date' | 'time' | 'textarea';

export interface FormFieldConfig {
  label: string;
  placeholder?: string;
  type: FormFieldType;
  required?: boolean;
  disabled?: boolean;
  errorMessage?: string;
}
