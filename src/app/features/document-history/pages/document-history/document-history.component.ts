import { formatDate } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';
import { catchError, from, map, of, switchMap, tap } from 'rxjs';

import { injectActionRunner } from '../../../../core/http/action-runner';
import { readApiErrorMessage } from '../../../../core/http/api-error';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DataTableCellDirective } from '../../../../shared/components/data-table/data-table-cell.directive';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { DataTableColumn, DataTableRow } from '../../../../shared/components/data-table/data-table.interface';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SearchInputComponent } from '../../../../shared/components/search-input/search-input.component';
import { SelectFieldComponent } from '../../../../shared/components/select-field/select-field.component';
import { SelectFieldOption } from '../../../../shared/components/select-field/select-field.interface';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
import { normalizeForSearch } from '../../../../shared/utils/search';
import { DocumentTypeService } from '../../../document-types/services/document-type.service';
import { MissionService } from '../../../missions/services/mission.service';
import { DocumentHistoryFilters } from '../../models/document-history-filters.model';
import { GeneratedDocument } from '../../models/generated-document.model';
import { DocumentHistoryService } from '../../services/document-history.service';
import { GeneratedDocumentDetailComponent } from '../generated-document-detail/generated-document-detail.component';

type HistoryLoadResult = { documents: GeneratedDocument[] } | { error: string };

@Component({
  selector: 'app-document-history',
  standalone: true,
  imports: [
    ButtonComponent,
    DataTableCellDirective,
    DataTableComponent,
    EmptyStateComponent,
    FileSizePipe,
    IconButtonComponent,
    LoadingComponent,
    ModalComponent,
    PageHeaderComponent,
    RouterOutlet,
    SearchInputComponent,
    SelectFieldComponent
  ],
  templateUrl: './document-history.component.html',
  styleUrl: './document-history.component.scss'
})
export class DocumentHistoryComponent {
  private readonly documentHistoryService = inject(DocumentHistoryService);
  private readonly documentTypeService = inject(DocumentTypeService);
  private readonly missionService = inject(MissionService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly runAction = injectActionRunner();

  readonly documents = signal<GeneratedDocument[]>([]);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  // Select values are strings; '' means "all".
  readonly typeFilter = signal<string>('');
  readonly missionFilter = signal<string>('');
  readonly search = signal<string>('');
  // Changing it reloads the list with the same filters.
  private readonly reloadCount = signal<number>(0);

  readonly typeOptions = signal<SelectFieldOption[]>([]);
  readonly missionOptions = signal<SelectFieldOption[]>([]);

  readonly downloadingId = signal<number | null>(null);
  readonly documentToDelete = signal<GeneratedDocument | null>(null);
  readonly deleting = signal<boolean>(false);

  readonly filters = computed<DocumentHistoryFilters & { reload: number }>(() => ({
    documentTypeId: this.typeFilter() ? Number(this.typeFilter()) : null,
    missionId: this.missionFilter() ? Number(this.missionFilter()) : null,
    reload: this.reloadCount()
  }));

  readonly hasFilters = computed(() => !!(this.typeFilter() || this.missionFilter() || this.search().trim()));

  readonly visibleDocuments = computed(() => {
    const query = normalizeForSearch(this.search().trim());

    if (!query) {
      return this.documents();
    }

    return this.documents().filter((document) =>
      [document.nomFichier, document.documentTypeNom, document.missionNumero ?? '', document.missionIntitule ?? '']
        .some((text) => normalizeForSearch(text).includes(query))
    );
  });

  readonly columns: DataTableColumn[] = [
    { key: 'nomFichier', label: 'Document' },
    { key: 'type', label: 'Type' },
    { key: 'mission', label: 'Mission' },
    { key: 'dateGeneration', label: 'Généré le' },
    { key: 'taille', label: 'Taille', align: 'right' },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  readonly rows = computed<DataTableRow[]>(() =>
    this.visibleDocuments().map((document) => ({
      id: document.id,
      nomFichier: document.nomFichier,
      type: document.documentTypeNom,
      mission: document.missionNumero ?? '—',
      dateGeneration: formatDate(document.dateGeneration, 'dd/MM/yyyy HH:mm', 'en-US'),
      taille: document.taille
    }))
  );

  constructor() {
    toObservable(this.filters)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.errorMessage.set(null);
        }),
        switchMap(({ documentTypeId, missionId }) =>
          this.documentHistoryService.getAll({ documentTypeId, missionId }).pipe(
            map((documents): HistoryLoadResult => ({ documents })),
            catchError((error: unknown) => from(readApiErrorMessage(error)).pipe(map((message) => ({ error: message }))))
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((result) => {
        if ('error' in result) {
          this.errorMessage.set(result.error);
        } else {
          this.documents.set(result.documents);
        }

        this.loading.set(false);
      });

    this.loadFilterOptions();
  }

  reloadDocuments(): void {
    this.reloadCount.update((count) => count + 1);
  }

  resetFilters(): void {
    this.typeFilter.set('');
    this.missionFilter.set('');
    this.search.set('');
  }

  findDocument(row: DataTableRow): GeneratedDocument | null {
    return this.documents().find((document) => document.id === row['id']) ?? null;
  }

  openCatalog(): void {
    this.router.navigate(['/documents']);
  }

  openDetail(document: GeneratedDocument): void {
    this.router.navigate(['/document-history', document.id]);
  }

  downloadDocument(document: GeneratedDocument): void {
    this.downloadingId.set(document.id);

    this.documentHistoryService.saveCopy(document.id).subscribe({
      next: () => this.downloadingId.set(null),
      error: async (error: unknown) => {
        this.downloadingId.set(null);
        this.toastService.error(await readApiErrorMessage(error));
      }
    });
  }

  askDelete(document: GeneratedDocument): void {
    this.documentToDelete.set(document);
  }

  confirmDelete(): void {
    const deleted = this.documentToDelete();

    if (!deleted) {
      return;
    }

    this.runAction(
      this.documentHistoryService.delete(deleted.id),
      this.deleting,
      () => {
        this.removeDocument(deleted.id);
        this.documentToDelete.set(null);
        this.toastService.success(`Le document « ${deleted.nomFichier} » a été supprimé.`);
      },
      () => this.documentToDelete.set(null)
    );
  }

  // Keeps the list up to date when a document is deleted from the drawer.
  onPanelOpened(component: unknown): void {
    if (component instanceof GeneratedDocumentDetailComponent) {
      component.documentDeleted.subscribe((documentId) => this.removeDocument(documentId));
    }
  }

  private removeDocument(documentId: number): void {
    this.documents.update((documents) => documents.filter((document) => document.id !== documentId));
  }

  // The filter lists are a convenience: if they cannot be loaded, the history stays usable without them.
  private loadFilterOptions(): void {
    this.documentTypeService
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe((types) =>
        this.typeOptions.set(types.map((type) => ({ value: String(type.id), label: type.nom })))
      );

    this.missionService
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe((missions) =>
        this.missionOptions.set(
          missions.map((mission) => ({ value: String(mission.id), label: `${mission.numero} — ${mission.intitule}` }))
        )
      );
  }
}
