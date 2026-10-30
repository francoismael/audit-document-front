import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed, toObservable } from '@angular/core/rxjs-interop';
import { catchError, from, map, switchMap, tap } from 'rxjs';

import { readApiErrorMessage } from '../../../../core/http/api-error';
import { CardComponent } from '../../../../shared/components/card/card.component';
import { DetailRowComponent } from '../../../../shared/components/detail-row/detail-row.component';
import { EmptyStateComponent } from '../../../../shared/components/empty-state/empty-state.component';
import { LoadingComponent } from '../../../../shared/components/loading/loading.component';
import { PageHeaderComponent } from '../../../../shared/components/page-header/page-header.component';
import { DYNAMIC_FIELD_TYPE_LABELS } from '../../../../shared/interfaces/dynamic-field.interface';
import { MISSION_ROLE_LABELS } from '../../../missions/models/mission-labels';
import { AppSettings } from '../../models/app-settings.model';
import { SettingsService } from '../../services/settings.service';

type SettingsLoadResult = { settings: AppSettings } | { error: string };

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CardComponent, DetailRowComponent, EmptyStateComponent, LoadingComponent, PageHeaderComponent],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent {
  private readonly settingsService = inject(SettingsService);

  readonly settings = signal<AppSettings | null>(null);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);
  private readonly reloadCount = signal<number>(0);

  readonly fieldTypeLabels = DYNAMIC_FIELD_TYPE_LABELS;
  readonly roleLabels = MISSION_ROLE_LABELS;

  constructor() {
    toObservable(this.reloadCount)
      .pipe(
        tap(() => {
          this.loading.set(true);
          this.errorMessage.set(null);
        }),
        switchMap(() =>
          this.settingsService.getSettings().pipe(
            map((settings): SettingsLoadResult => ({ settings })),
            catchError((error: unknown) => from(readApiErrorMessage(error)).pipe(map((message) => ({ error: message }))))
          )
        ),
        takeUntilDestroyed()
      )
      .subscribe((result) => {
        if ('error' in result) {
          this.errorMessage.set(result.error);
        } else {
          this.settings.set(result.settings);
        }

        this.loading.set(false);
      });
  }

  reload(): void {
    this.reloadCount.update((count) => count + 1);
  }
}
