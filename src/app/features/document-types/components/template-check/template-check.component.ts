import { Component, input } from '@angular/core';

import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TemplateValidation } from '../../models/document-template.model';

@Component({
  selector: 'app-template-check',
  standalone: true,
  imports: [StatusBadgeComponent],
  templateUrl: './template-check.component.html',
  styleUrl: './template-check.component.scss'
})
export class TemplateCheckComponent {
  readonly validation = input.required<TemplateValidation>();

  toVariable(name: string): string {
    return `{{ ${name} }}`;
  }
}
