import { Component, input } from '@angular/core';

import {
  DynamicField,
  DynamicFieldValue,
  DynamicFormValues
} from '../../interfaces/dynamic-field.interface';

@Component({
  selector: 'app-document-preview',
  standalone: true,
  templateUrl: './document-preview.component.html',
  styleUrl: './document-preview.component.scss'
})
export class DocumentPreviewComponent {
  readonly title = input.required<string>();
  readonly fields = input.required<DynamicField[]>();
  readonly values = input.required<DynamicFormValues>();

  displayValue(field: DynamicField): string {
    const value: DynamicFieldValue | undefined = this.values()[field.name];

    if (typeof value === 'boolean') {
      return value ? 'Oui' : 'Non';
    }

    if (!value) {
      return '—';
    }

    if (field.type === 'DATE') {
      const [year, month, day] = value.split('-');

      return `${day}/${month}/${year}`;
    }

    return value;
  }
}
