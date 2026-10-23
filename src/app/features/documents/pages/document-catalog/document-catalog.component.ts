import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';

import { readApiErrorMessage } from '../../../../core/http/api-error';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { normalizeForSearch } from '../../../../shared/utils/search';
import { DocumentType } from '../../../document-types/models/document-type.model';
import { DocumentTypeService } from '../../../document-types/services/document-type.service';

@Component({
  selector: 'app-document-catalog',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    EmptyStateComponent,
    LoadingComponent,
    PageHeaderComponent,
    SearchInputComponent
  ],
  templateUrl: './document-catalog.component.html',
  styleUrl: './document-catalog.component.scss'
})
export class DocumentCatalogComponent {
  private readonly documentTypeService = inject(DocumentTypeService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  readonly documentTypes = signal<DocumentType[]>([]);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly search = signal<string>('');

  readonly activeTypes = computed(() =>
    this.documentTypes().filter((documentType) => documentType.actif)
  );

  readonly filteredTypes = computed(() => {
    const query = normalizeForSearch(this.search().trim());

    if (!query) {
      return this.activeTypes();
    }

    return this.activeTypes().filter(
      (documentType) =>
        normalizeForSearch(documentType.nom).includes(query) || normalizeForSearch(documentType.code).includes(query)
    );
  });

  readonly countLabel = computed(() => {
    const total = this.activeTypes().length;

    if (!this.search().trim()) {
      return total > 1 ? `${total} types de documents` : `${total} type de document`;
    }

    const found = this.filteredTypes().length;

    return `${found} résultat${found > 1 ? 's' : ''} sur ${total}`;
  });

  constructor() {
    this.loadDocumentTypes();
  }

  loadDocumentTypes(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.documentTypeService
      .getAll()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (documentTypes) => {
          this.documentTypes.set(documentTypes);
          this.loading.set(false);
        },
        error: async (error: unknown) => {
          this.errorMessage.set(await readApiErrorMessage(error));
          this.loading.set(false);
        }
      });
  }

  openGenerator(documentType: DocumentType): void {
    this.router.navigate(['/documents/generer', documentType.id]);
  }

  openDocumentTypes(): void {
    this.router.navigate(['/document-types']);
  }
}
