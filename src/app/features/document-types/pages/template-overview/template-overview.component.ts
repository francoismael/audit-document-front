import { formatDate } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { Router } from '@angular/router';
import { Observable, catchError, forkJoin, from, map, of, switchMap, tap } from 'rxjs';

import { readApiErrorMessage } from '../../../../core/http/api-error';
import { DataTableCellDirective } from '../../../../shared/components/data-table/data-table-cell.directive';
import { DataTableComponent } from '../../../../shared/components/data-table/data-table.component';
import { DataTableColumn, DataTableRow } from '../../../../shared/components/data-table/data-table.interface';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { StatTileComponent } from '../../../../shared/components/stat-tile/stat-tile.component';
import { StatusBadgeComponent } from '../../../../shared/components/status-badge/status-badge.component';
import { StatusBadgeStatus } from '../../../../shared/components/status-badge/status-badge.interface';
import { TemplateValidation } from '../../models/document-template.model';
import { DocumentTypeForm } from '../../models/document-type.model';
import { DocumentTypeService } from '../../services/document-type.service';

// A type with its active template, its fields and the check of the template.
interface TemplateOverviewItem {
  form: DocumentTypeForm;
  // Null without a template, or when the check could not be made.
  validation: TemplateValidation | null;
}

type OverviewLoadResult = { items: TemplateOverviewItem[] } | { error: string };

interface CheckBadge {
  status: StatusBadgeStatus;
  label: string;
}

// Overview of the templates of every type. They are changed in "Types de documents" (/document-types/:id).
@Component({
  selector: 'app-template-overview',
  standalone: true,
  imports: [
    DataTableCellDirective,
    DataTableComponent,
    EmptyStateComponent,
    IconButtonComponent,
    LoadingComponent,
    PageHeaderComponent,
    StatTileComponent,
    StatusBadgeComponent
  ],
  templateUrl: './template-overview.component.html',
  styleUrl: './template-overview.component.scss'
})
export class TemplateOverviewComponent {
  private readonly documentTypeService = inject(DocumentTypeService);
  private readonly router = inject(Router);

  readonly items = signal<TemplateOverviewItem[]>([]);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  private readonly reloadCount = signal<number>(0);

  readonly withTemplate = computed(() => this.items().filter((item) => item.form.template !== null).length);
  readonly validTemplates = computed(() => this.items().filter((item) => item.validation?.valid === true).length);
  readonly fieldCount = computed(() => this.items().reduce((total, item) => total + item.form.fields.length, 0));

  readonly columns: DataTableColumn[] = [
    { key: 'type', label: 'Type de document' },
    { key: 'statut', label: 'Statut' },
    { key: 'modele', label: 'Modèle Word' },
    { key: 'champs', label: 'Champs', align: 'center' },
    { key: 'verification', label: 'Vérification' },
    { key: 'actions', label: 'Actions', align: 'right' }
  ];

  readonly rows = computed<DataTableRow[]>(() =>
    this.items().map((item) => ({
      id: item.form.documentType.id,
      type: item.form.documentType.nom,
      champs: item.form.fields.length
    }))
  );

  constructor() {
    toObservable(this.reloadCount)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.errorMessage.set(null);
        }),
        switchMap(() =>
          this.loadItems().pipe(
            map((items): OverviewLoadResult => ({ items })),
            catchError((error: unknown) => from(readApiErrorMessage(error)).pipe(map((message) => ({ error: message }))))
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((result) => {
        if ('error' in result) {
          this.errorMessage.set(result.error);
        } else {
          this.items.set(result.items);
        }

        this.loading.set(false);
      });
  }

  reload(): void {
    this.reloadCount.update((count) => count + 1);
  }

  findItem(row: DataTableRow): TemplateOverviewItem | null {
    return this.items().find((item) => item.form.documentType.id === row['id']) ?? null;
  }

  templateDate(item: TemplateOverviewItem): string {
    return item.form.template ? formatDate(item.form.template.dateUpload, 'dd/MM/yyyy', 'en-US') : '';
  }

  requiredFields(item: TemplateOverviewItem): number {
    return item.form.fields.filter((field) => field.obligatoire).length;
  }

  // Same wording as the check of the configuration panel.
  checkBadge(item: TemplateOverviewItem): CheckBadge {
    if (!item.form.template) {
      return { status: 'draft', label: 'Sans modèle' };
    }

    if (!item.validation) {
      return { status: 'cancelled', label: 'Non vérifié' };
    }

    if (item.validation.valid) {
      return { status: 'approved', label: 'Conforme' };
    }

    const gaps = item.validation.missingFields.length + item.validation.unknownVariables.length;
    return { status: 'pending', label: `${gaps} écart${gaps > 1 ? 's' : ''}` };
  }

  configure(item: TemplateOverviewItem): void {
    this.router.navigate(['/document-types', item.form.documentType.id]);
  }

  openTypes(): void {
    this.router.navigate(['/document-types']);
  }

  // One form per type, then the check of each template. A failed check does not hide the type.
  private loadItems(): Observable<TemplateOverviewItem[]> {
    return this.documentTypeService.getAll().pipe(
      switchMap((types) =>
        types.length === 0
          ? of([])
          : forkJoin(
              types.map((type) =>
                this.documentTypeService.getForm(type.id).pipe(
                  switchMap((form) =>
                    form.template
                      ? this.documentTypeService.validateTemplate(type.id).pipe(
                          map((validation): TemplateOverviewItem => ({ form, validation })),
                          catchError(() => of<TemplateOverviewItem>({ form, validation: null }))
                        )
                      : of<TemplateOverviewItem>({ form, validation: null })
                  )
                )
              )
            )
      )
    );
  }
}
