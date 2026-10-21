import { Component } from '@angular/core';

import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-document-type-config',
  standalone: true,
  imports: [EmptyStateComponent, PageHeaderComponent],
  templateUrl: './document-type-config.component.html',
  styleUrl: './document-type-config.component.scss'
})
export class DocumentTypeConfigComponent {}
