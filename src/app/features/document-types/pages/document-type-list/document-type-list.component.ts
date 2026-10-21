import { formatDate } from '@angular/common';
import { Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Router, RouterOutlet } from '@angular/router';

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
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { DocumentTypeConfigComponent } from '../document-type-config/document-type-config.component';
import { DocumentTypeFormModalComponent } from '../../components/document-type-form-modal/document-type-form-modal.component';
import { DocumentType, DocumentTypeRequest } from '../../models/document-type.model';
import { DocumentTypeService } from '../../services/document-type.service';

@Component({
  selector: 'app-document-type-list',
  standalone: true,
  imports: [
    ButtonComponent,
    DataTableCellDirective,
    DataTableComponent,
    DocumentTypeFormModalComponent,
    EmptyStateComponent,
    IconButtonComponent,
    LoadingComponent,
    ModalComponent,
    PageHeaderComponent,
    RouterOutlet,
    StatusBadgeComponent
  ],
  templateUrl: './document-type-list.component.html',
  styleUrl: './document-type-list.component.scss'
})
export class DocumentTypeListComponent {
  private readonly documentTypeService = inject(DocumentTypeService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly runAction = injectActionRunner();

  readonly documentTypes = signal<DocumentType[]>([]);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly formOpen = signal<boolean>(false);
  readonly editedType = signal<DocumentType | null>(null);
  readonly saving = signal<boolean>(false);

  readonly typeToDelete = signal<DocumentType | null>(null);
  readonly deleting = signal<boolean>(false);
  readonly statusChangingId = signal<number | null>(null);

  readonly columns: DataTableColumn[] = [
    { key: 'nom', label: 'Nom' },
    { key: 'code', label: 'Code' },
    { key: 'description', label: 'Description' },
    { key: 'actif', label: 'Statut' },
    { key: 'dateCreation', label: 'Créé le' },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  readonly rows = computed<DataTableRow[]>(() =>
    this.documentTypes().map((documentType) => ({
      id: documentType.id,
      nom: documentType.nom,
      code: documentType.code,
      description: documentType.description,
      actif: documentType.actif,
      dateCreation: formatDate(documentType.dateCreation, 'dd/MM/yyyy', 'en-US')
    }))
  );

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

  findDocumentType(row: DataTableRow): DocumentType | null {
    return this.documentTypes().find((documentType) => documentType.id === row['id']) ?? null;
  }

  openCreateForm(): void {
    this.editedType.set(null);
    this.formOpen.set(true);
  }

  openEditForm(documentType: DocumentType): void {
    this.editedType.set(documentType);
    this.formOpen.set(true);
  }

  closeForm(): void {
    this.formOpen.set(false);
  }

  saveDocumentType(request: DocumentTypeRequest): void {
    const editedType = this.editedType();
    const save$ = editedType
      ? this.documentTypeService.update(editedType.id, request)
      : this.documentTypeService.create(request);

    this.runAction(save$, this.saving, (saved) => {
      this.formOpen.set(false);

      if (editedType) {
        this.replaceDocumentType(saved);
        this.toastService.success(`Le type « ${saved.nom} » a été modifié.`);
        return;
      }

      this.toastService.success(`Le type « ${saved.nom} » a été créé. Ajoutez maintenant son modèle Word et ses champs.`);
      this.openConfiguration(saved);
    });
  }

  toggleStatus(documentType: DocumentType): void {
    this.statusChangingId.set(documentType.id);

    this.documentTypeService
      .changeStatus(documentType.id, !documentType.actif)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (updated) => {
          this.replaceDocumentType(updated);
          this.statusChangingId.set(null);
          this.toastService.success(
            updated.actif
              ? `« ${updated.nom} » est activé : il apparaît dans le catalogue.`
              : `« ${updated.nom} » est désactivé : il n'apparaît plus dans le catalogue.`
          );
        },
        error: async (error: unknown) => {
          this.statusChangingId.set(null);
          this.toastService.error(await readApiErrorMessage(error));
        }
      });
  }

  askDelete(documentType: DocumentType): void {
    this.typeToDelete.set(documentType);
  }

  cancelDelete(): void {
    this.typeToDelete.set(null);
  }

  confirmDelete(): void {
    const documentType = this.typeToDelete();

    if (!documentType) {
      return;
    }

    this.runAction(
      this.documentTypeService.delete(documentType.id),
      this.deleting,
      () => {
        this.documentTypes.update((types) => types.filter((type) => type.id !== documentType.id));
        this.typeToDelete.set(null);
        this.toastService.success(`Le type « ${documentType.nom} » a été supprimé.`);
      },
      // A type already used must be disabled instead: the backend message says so.
      () => this.typeToDelete.set(null)
    );
  }

  openConfiguration(documentType: DocumentType): void {
    this.router.navigate(['/document-types', documentType.id]);
  }

  // Keeps the row up to date when the type is modified in the drawer.
  onPanelOpened(component: unknown): void {
    if (component instanceof DocumentTypeConfigComponent) {
      component.documentTypeChanged.subscribe((documentType) => this.replaceDocumentType(documentType));
    }
  }

  private replaceDocumentType(updated: DocumentType): void {
    this.documentTypes.update((types) => types.map((type) => (type.id === updated.id ? updated : type)));
  }
}
