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
  // Lets the user pick the placeholder again to clear an optional choice.
  allowEmpty?: boolean;
}
