import { Component, DestroyRef, computed, inject, input, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable, catchError, from, map, of, switchMap, tap } from 'rxjs';

import { readApiErrorMessage } from '../../../../core/http/api-error';
import { openFile, saveFile } from '../../../../core/http/file-download';
import { ToastService } from '../../../../core/services/toast.service';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { DocumentPreviewComponent } from '../../../../shared/components/document-preview/document-preview.component';
import { DocumentPreviewRow } from '../../../../shared/components/document-preview/document-preview.interface';
import { DynamicFormComponent } from '../../../../shared/components/dynamic-form/dynamic-form.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { SelectFieldComponent } from '../../../../shared/components/select-field/select-field.component';
import { SelectFieldConfig } from '../../../../shared/components/select-field/select-field.interface';
import { DynamicFormValues } from '../../../../shared/interfaces/dynamic-field.interface';
import { DocumentTypeForm } from '../../../document-types/models/document-type.model';
import { DocumentTypeService } from '../../../document-types/services/document-type.service';
import { Mission } from '../../../missions/models/mission.model';
import { MissionService } from '../../../missions/services/mission.service';
import { toDynamicFields } from '../../models/dynamic-field.mapper';
import { GeneratedFile } from '../../models/generated-file.model';
import { DocumentGenerationService } from '../../services/document-generation.service';

type FormLoadResult = { form: DocumentTypeForm } | { error: string };

@Component({
  selector: 'app-document-generate',
  standalone: true,
  imports: [
    ButtonComponent,
    CardComponent,
    DocumentPreviewComponent,
    DynamicFormComponent,
    EmptyStateComponent,
    LoadingComponent,
    PageHeaderComponent,
    SelectFieldComponent
  ],
  templateUrl: './document-generate.component.html',
  styleUrl: './document-generate.component.scss'
})
export class DocumentGenerateComponent {
  private readonly documentTypeService = inject(DocumentTypeService);
  private readonly missionService = inject(MissionService);
  private readonly documentGenerationService = inject(DocumentGenerationService);
  private readonly toastService = inject(ToastService);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);

  // Bound from the :documentTypeId route parameter.
  readonly documentTypeId = input.required<string>();

  readonly form = signal<DocumentTypeForm | null>(null);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  readonly missions = signal<Mission[]>([]);
  readonly missionId = signal<string>('');
  // Kept when going back to the form, so the user never retypes their input.
  readonly values = signal<DynamicFormValues>({});
  readonly reviewing = signal<boolean>(false);
  readonly generating = signal<boolean>(false);
  readonly generatedFile = signal<GeneratedFile | null>(null);

  readonly fields = computed(() => toDynamicFields(this.form()?.fields ?? []));

  readonly selectedMission = computed(
    () => this.missions().find((mission) => String(mission.id) === this.missionId()) ?? null
  );

  readonly summaryRows = computed<DocumentPreviewRow[]>(() => {
    const mission = this.selectedMission();

    return [
      {
        label: 'Mission associée',
        value: mission ? `${mission.numero} — ${mission.intitule}` : 'Aucune'
      }
    ];
  });

  readonly missionFieldConfig = computed<SelectFieldConfig>(() => ({
    label: 'Mission associée (facultatif)',
    placeholder: 'Aucune mission',
    allowEmpty: true,
    options: this.missions().map((mission) => ({
      value: String(mission.id),
      label: `${mission.numero} — ${mission.intitule}`
    }))
  }));

  constructor() {
    toObservable(this.documentTypeId)
      .pipe(
        tap(() => this.resetState()),
        switchMap((documentTypeId) => this.loadForm(documentTypeId)),
        takeUntilDestroyed()
      )
      .subscribe((result) => {
        if ('error' in result) {
          this.errorMessage.set(result.error);
        } else {
          this.form.set(result.form);
        }

        this.loading.set(false);
      });

    this.loadMissions();
  }

  onReview(values: DynamicFormValues): void {
    this.values.set(values);
    this.reviewing.set(true);
  }

  onEdit(): void {
    this.reviewing.set(false);
  }

  onConfirmGeneration(): void {
    const form = this.form();

    if (!form || this.generating()) {
      return;
    }

    this.generating.set(true);

    this.documentGenerationService
      .generate(form.documentType.id, this.values(), this.selectedMission()?.id ?? null)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe({
        next: (file) => {
          this.generatedFile.set(file);
          this.generating.set(false);
          this.toastService.success('Le document PDF a été généré.');
        },
        // The user stays on the summary, with every value kept, and can try again.
        error: async (error: unknown) => {
          this.toastService.error(await readApiErrorMessage(error));
          this.generating.set(false);
        }
      });
  }

  openPdf(): void {
    const file = this.generatedFile();

    if (file) {
      openFile(file.content);
    }
  }

  downloadPdf(): void {
    const file = this.generatedFile();

    if (file) {
      saveFile(file.content, file.fileName);
    }
  }

  // Opens the drawer of the new document when its id is known.
  openHistory(): void {
    const documentId = this.generatedFile()?.documentId;
    this.router.navigate(documentId ? ['/document-history', documentId] : ['/document-history']);
  }

  createAnotherDocument(): void {
    this.generatedFile.set(null);
    this.values.set({});
    this.missionId.set('');
    this.reviewing.set(false);
  }

  openCatalog(): void {
    this.router.navigate(['/documents']);
  }

  openConfiguration(): void {
    this.router.navigate(['/document-types', this.documentTypeId()]);
  }

  private resetState(): void {
    this.loading.set(true);
    this.errorMessage.set(null);
    this.form.set(null);
    this.values.set({});
    this.reviewing.set(false);
    this.generating.set(false);
    this.generatedFile.set(null);
  }

  private loadForm(rawDocumentTypeId: string): Observable<FormLoadResult> {
    const documentTypeId = Number(rawDocumentTypeId);

    if (!Number.isInteger(documentTypeId) || documentTypeId <= 0) {
      return of({ error: 'Ce type de document est introuvable.' });
    }

    return this.documentTypeService.getForm(documentTypeId).pipe(
      map((form): FormLoadResult =>
        form.documentType.actif
          ? { form }
          : { error: 'Ce type de document est désactivé : il ne peut pas servir à générer un document.' }
      ),
      catchError((error: unknown) =>
        from(readApiErrorMessage(error)).pipe(map((message): FormLoadResult => ({ error: message })))
      )
    );
  }

  // The mission list is optional: a failure must not block the form.
  private loadMissions(): void {
    this.missionService
      .getAll()
      .pipe(takeUntilDestroyed())
      .subscribe({
        next: (missions) => this.missions.set(missions),
        error: async (error: unknown) =>
          this.toastService.warning(
            `Impossible de charger les missions : ${await readApiErrorMessage(error)}`
          )
      });
  }
}
