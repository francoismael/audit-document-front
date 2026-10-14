
export type FormFieldType = 'text' | 'email' | 'password' | 'number' | 'date' | 'textarea';

export interface FormFieldConfig {
  label: string;
  placeholder?: string;
  type: FormFieldType;
  required?: boolean;
  disabled?: boolean;
  errorMessage?: string;
}
