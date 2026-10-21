import { Component } from '@angular/core';

import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-document-type-list',
  standalone: true,
  imports: [EmptyStateComponent, PageHeaderComponent],
  templateUrl: './document-type-list.component.html',
  styleUrl: './document-type-list.component.scss'
})
export class DocumentTypeListComponent {}
