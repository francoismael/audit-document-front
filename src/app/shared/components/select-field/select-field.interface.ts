
export interface SelectFieldOption {
  label: string;
  value: string;
}

export interface SelectFieldConfig {
  label: string;
  placeholder?: string;
  options: SelectFieldOption[];
  required?: boolean;
  disabled?: boolean;
  errorMessage?: string;
}
