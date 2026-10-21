import { DatePipe } from '@angular/common';
import { Component, DestroyRef, computed, inject, input, output, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable, catchError, from, map, switchMap, tap } from 'rxjs';

import { injectActionRunner } from '../../../../core/http/action-runner';
import { readApiErrorMessage } from '../../../../core/http/api-error';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DetailRowComponent } from '../../../../shared/components/detail-row/detail-row.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { FileUploadComponent } from '../../../../shared/components/file-upload/file-upload.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SidePanelComponent } from '../../../../shared/components/side-panel/side-panel.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { TabsComponent } from '../../../../shared/components/tabs/tabs.component';
import { TabItem } from '../../../../shared/components/tabs/tabs.interface';
import { DYNAMIC_FIELD_TYPE_LABELS } from '../../../../shared/interfaces/dynamic-field.interface';
import { FileSizePipe } from '../../../../shared/pipes/file-size.pipe';
import { DocumentFieldFormModalComponent } from '../../components/document-field-form-modal/document-field-form-modal.component';
import { DocumentTypeFormModalComponent } from '../../components/document-type-form-modal/document-type-form-modal.component';
import { TemplateCheckComponent } from '../../components/template-check/template-check.component';
import { DocumentField, DocumentFieldRequest } from '../../models/document-field.model';
import { TemplateValidation } from '../../models/document-template.model';
import { DocumentType, DocumentTypeForm, DocumentTypeRequest } from '../../models/document-type.model';
import { DocumentFieldService } from '../../services/document-field.service';
import { DocumentTypeService } from '../../services/document-type.service';

type ConfigurationLoadResult = { configuration: DocumentTypeForm } | { error: string };

type ConfigurationTab = 'details' | 'fields' | 'check';

@Component({
  selector: 'app-document-type-config',
  standalone: true,
  imports: [
    ButtonComponent,
    DatePipe,
    DetailRowComponent,
    DocumentFieldFormModalComponent,
    DocumentTypeFormModalComponent,
    EmptyStateComponent,
    FileSizePipe,
    FileUploadComponent,
    IconButtonComponent,
    LoadingComponent,
    ModalComponent,
    SidePanelComponent,
    StatusBadgeComponent,
    TabsComponent,
    TemplateCheckComponent
  ],
  templateUrl: './document-type-config.component.html',
  styleUrl: './document-type-config.component.scss'
})
export class DocumentTypeConfigComponent {
  private readonly documentTypeService = inject(DocumentTypeService);
  private readonly documentFieldService = inject(DocumentFieldService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly runAction = injectActionRunner();

  // Bound from the :id route parameter. The component is reused when another type is opened.
  readonly id = input.required<string>();

  // Lets the list show the new name or description right away.
  readonly documentTypeChanged = output<DocumentType>();

  readonly activeTab = signal<ConfigurationTab>('details');
  readonly configuration = signal<DocumentTypeForm | null>(null);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  readonly typeFormOpen = signal<boolean>(false);
  readonly savingType = signal<boolean>(false);

  readonly replacingTemplate = signal<boolean>(false);
  readonly pendingFile = signal<File | null>(null);
  readonly uploading = signal<boolean>(false);

  readonly fieldFormOpen = signal<boolean>(false);
  readonly editedField = signal<DocumentField | null>(null);
  readonly savingField = signal<boolean>(false);
  readonly fieldToDelete = signal<DocumentField | null>(null);
  readonly deletingField = signal<boolean>(false);

  readonly validation = signal<TemplateValidation | null>(null);
  readonly validating = signal<boolean>(false);

  readonly documentTypeId = computed(() => Number(this.id()));
  readonly documentType = computed(() => this.configuration()?.documentType ?? null);
  readonly template = computed(() => this.configuration()?.template ?? null);
  readonly fields = computed(() => this.configuration()?.fields ?? []);
  readonly showUploader = computed(() => !this.template() || this.replacingTemplate());
  readonly canGenerate = computed(() => !!this.template() && !!this.documentType()?.actif);

  readonly takenFieldNames = computed(() => {
    const editedId = this.editedField()?.id;

    return this.fields()
      .filter((field) => field.id !== editedId)
      .map((field) => field.nom);
  });

  readonly fieldTypeLabels = DYNAMIC_FIELD_TYPE_LABELS;

  readonly tabs = computed<TabItem[]>(() => [
    { id: 'details', label: 'Détails' },
    { id: 'fields', label: 'Champs', count: this.fields().length },
    { id: 'check', label: 'Vérification' }
  ]);

  constructor() {
    toObservable(this.documentTypeId)
      .pipe(
        tap(() => this.resetState()),
        switchMap((documentTypeId) => this.fetchConfiguration(documentTypeId)),
        takeUntilDestroyed()
      )
      .subscribe((result) => {
        if ('error' in result) {
          this.errorMessage.set(result.error);
        } else {
          this.configuration.set(result.configuration);
        }

        this.loading.set(false);
      });
  }

  selectTab(tab: string): void {
    this.activeTab.set(tab as ConfigurationTab);
  }

  saveDocumentType(request: DocumentTypeRequest): void {
    this.runAction(this.documentTypeService.update(this.documentTypeId(), request), this.savingType, (documentType) => {
      this.updateConfiguration({ documentType });
      this.documentTypeChanged.emit(documentType);
      this.typeFormOpen.set(false);
      this.toastService.success('Les informations du type ont été modifiées.');
    });
  }

  cancelTemplateReplacement(): void {
    this.replacingTemplate.set(false);
    this.pendingFile.set(null);
  }

  uploadTemplate(): void {
    const file = this.pendingFile();

    if (!file) {
      return;
    }

    this.runAction(this.documentTypeService.uploadTemplate(this.documentTypeId(), file), this.uploading, (template) => {
      this.updateConfiguration({ template });
      this.cancelTemplateReplacement();
      this.toastService.success(`Le modèle « ${template.nomFichierOriginal} » est en place (version ${template.version}).`);
      // The new file may not contain the same variables: check it right away and show the result.
      this.activeTab.set('check');
      this.validateTemplate();
    });
  }

  openFieldForm(field: DocumentField | null): void {
    this.editedField.set(field);
    this.fieldFormOpen.set(true);
  }

  closeFieldForm(): void {
    this.fieldFormOpen.set(false);
  }

  saveField(request: DocumentFieldRequest): void {
    const editedField = this.editedField();
    const save$ = editedField
      ? this.documentFieldService.update(editedField.id, request)
      : this.documentFieldService.create(request);

    this.runAction(save$, this.savingField, (saved) => {
      const fields = editedField
        ? this.fields().map((field) => (field.id === saved.id ? saved : field))
        : [...this.fields(), saved];

      this.updateConfiguration({ fields });
      this.fieldFormOpen.set(false);
      this.toastService.success(
        editedField ? `Le champ « ${saved.libelle} » a été modifié.` : `Le champ « ${saved.libelle} » a été ajouté.`
      );
    });
  }

  askFieldDeletion(field: DocumentField): void {
    this.fieldToDelete.set(field);
  }

  cancelFieldDeletion(): void {
    this.fieldToDelete.set(null);
  }

  confirmFieldDeletion(): void {
    const deleted = this.fieldToDelete();

    if (!deleted) {
      return;
    }

    this.runAction(
      this.documentFieldService.delete(deleted.id),
      this.deletingField,
      () => {
        this.fieldToDelete.set(null);
        this.toastService.success(`Le champ « ${deleted.libelle} » a été supprimé.`);
        // The backend renumbers the remaining fields: reload them to show the new order.
        this.reloadFields();
      },
      () => this.fieldToDelete.set(null)
    );
  }

  validateTemplate(): void {
    this.runAction(this.documentTypeService.validateTemplate(this.documentTypeId()), this.validating, (validation) =>
      this.validation.set(validation)
    );
  }

  openGeneration(): void {
    this.router.navigate(['/documents/generer', this.documentTypeId()]);
  }

  close(): void {
    this.router.navigate(['/document-types']);
  }

  private fetchConfiguration(documentTypeId: number): Observable<ConfigurationLoadResult> {
    return this.documentTypeService.getForm(documentTypeId).pipe(
      map((configuration) => ({ configuration })),
      catchError((error: unknown) => from(readApiErrorMessage(error)).pipe(map((message) => ({ error: message }))))
    );
  }

  private resetState(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.activeTab.set('details');
    this.configuration.set(null);
    this.validation.set(null);
    this.cancelTemplateReplacement();
    this.fieldFormOpen.set(false);
    this.fieldToDelete.set(null);
  }

  private reloadFields(): void {
    this.documentTypeService
      .getForm(this.documentTypeId())
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (configuration) => this.updateConfiguration({ fields: configuration.fields }),
        error: async (error: unknown) => this.toastService.error(await readApiErrorMessage(error))
      });
  }

  // Any change of the template or of the fields makes the last check outdated.
  private updateConfiguration(changes: Partial<DocumentTypeForm>): void {
    const configuration = this.configuration();

    if (configuration) {
      this.configuration.set({ ...configuration, ...changes });
    }

    if (changes.template || changes.fields) {
      this.validation.set(null);
    }
  }
}
