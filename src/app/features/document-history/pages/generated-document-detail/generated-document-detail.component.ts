import { DatePipe } from '@angular/common';
import { Component, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable, catchError, from, map, of, switchMap, tap } from 'rxjs';

import { injectActionRunner } from '../../../../core/http/action-runner';
import { readApiErrorMessage } from '../../../../core/http/api-error';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DetailRowComponent } from '../../../../shared/components/detail-row/detail-row.component';
import { DocumentPreviewComponent } from '../../../../shared/components/document-preview/document-preview.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SidePanelComponent } from '../../../../shared/components/side-panel/side-panel.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { TabItem } from '../../../../shared/components/tabs/tabs.interface';
import { DynamicField, DynamicFormValues } from '../../../../shared/interfaces/dynamic-field.interface';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
import { DocumentTypeService } from '../../../document-types/services/document-type.service';
import { toDynamicFields } from '../../../documents/models/dynamic-field.mapper';
import { GeneratedDocument } from '../../models/generated-document.model';
import { DocumentHistoryService } from '../../services/document-history.service';

type DetailTab = 'details' | 'values';

interface LoadedDocument {
  document: GeneratedDocument;
  // Current fields of the document type, used for the labels of the values. Empty if the type was deleted.
  fields: DynamicField[];
}

type DetailLoadResult = LoadedDocument | { error: string };

@Component({
  selector: 'app-generated-document-detail',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    DetailRowComponent,
    DocumentPreviewComponent,
    EmptyStateComponent,
    FileSizePipe,
    IconButtonComponent,
    LoadingComponent,
    ModalComponent,
    SidePanelComponent,
    TabsComponent
  ],
  templateUrl: './generated-document-detail.component.html',
  styleUrl: './generated-document-detail.component.scss'
})
export class GeneratedDocumentDetailComponent {
  private readonly documentHistoryService = inject(DocumentHistoryService);
  private readonly documentTypeService = inject(DocumentTypeService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly runAction = injectActionRunner();

  // Bound from the :id route parameter. The component is reused when another document is opened.
  readonly id = input.required<string>();

  // Lets the list remove the row right away.
  readonly documentDeleted = output<number>();

  readonly loaded = signal<LoadedDocument | null>(null);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly activeTab = signal<DetailTab>('details');
  readonly downloading = signal<boolean>(false);
  readonly confirmingDeletion = signal<boolean>(false);
  readonly deleting = signal<boolean>(false);

  readonly documentId = computed(() => Number(this.id()));
  readonly document = computed(() => this.loaded()?.document ?? null);

  readonly format = computed(() => {
    const fileName = this.document()?.nomFichier ?? '';
    return fileName.toLowerCase().endsWith('.docx') ? 'DOCX' : 'PDF';
  });

  // Fields of the type, then the values whose field no longer exists (shown with their technical name).
  readonly previewFields = computed<DynamicField[]>(() => {
    const loaded = this.loaded();

    if (!loaded) {
      return [];
    }

    const knownNames = new Set(loaded.fields.map((field) => field.name));
    const removedFields: DynamicField[] = Object.keys(loaded.document.valeurs)
      .filter((name) => !knownNames.has(name))
      .map((name) => ({ name, label: name, type: 'TEXT', required: false }));

    return [...loaded.fields, ...removedFields];
  });

  readonly previewValues = computed<DynamicFormValues>(() => {
    const values: DynamicFormValues = {};

    for (const [name, value] of Object.entries(this.document()?.valeurs ?? {})) {
      values[name] = typeof value === 'boolean' ? value : value === null ? '' : String(value);
    }

    return values;
  });

  readonly tabs = computed<TabItem[]>(() => [
    { id: 'details', label: 'Détails' },
    { id: 'values', label: 'Valeurs saisies', count: Object.keys(this.document()?.valeurs ?? {}).length }
  ]);

  constructor() {
    toObservable(this.documentId)
      .pipe(
        tap(() => this.resetState()),
        switchMap((documentId) => this.fetchDocument(documentId)),
        takeUntilDestroyed()
      )
      .subscribe((result) => {
        if ('error' in result) {
          this.errorMessage.set(result.error);
        } else {
          this.loaded.set(result);
        }

        this.loading.set(false);
      });
  }

  selectTab(tab: string): void {
    this.activeTab.set(tab as DetailTab);
  }

  downloadDocument(): void {
    this.runAction(this.documentHistoryService.saveCopy(this.documentId()), this.downloading, () => undefined);
  }

  confirmDeletion(): void {
    const document = this.document();

    if (!document) {
      return;
    }

    this.runAction(
      this.documentHistoryService.delete(document.id),
      this.deleting,
      () => {
        this.confirmingDeletion.set(false);
        this.documentDeleted.emit(document.id);
        this.toastService.success(`Le document « ${document.nomFichier} » a été supprimé.`);
        this.close();
      },
      () => this.confirmingDeletion.set(false)
    );
  }

  close(): void {
    this.router.navigate(['/document-history']);
  }

  private fetchDocument(documentId: number): Observable<DetailLoadResult> {
    return this.documentHistoryService.getById(documentId).pipe(
      switchMap((document) =>
        this.documentTypeService.getForm(document.documentTypeId).pipe(
          map((form) => ({ document, fields: toDynamicFields(form.fields) })),
          catchError(() => of({ document, fields: [] }))
        )
      ),
      catchError((error: unknown) => from(readApiErrorMessage(error)).pipe(map((message) => ({ error: message }))))
    );
  }

  private resetState(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.loaded.set(null);
    this.activeTab.set('details');
    this.confirmingDeletion.set(false);
  }
}
