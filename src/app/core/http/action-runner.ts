import { DestroyRef, WritableSignal, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { Observable } from 'rxjs';

import { ToastService } from '../services/toast.service';
import { readApiErrorMessage } from './api-error';

export type ActionRunner = <T>(
  action$: Observable<T>,
  busy: WritableSignal<boolean>,
  onSuccess: (result: T) => void,
  onError?: () => void
) => void;

// Returns a function that runs an API call with a busy flag, then shows the API message as a toast if it fails.
// Must be called in an injection context (a component field or constructor).
export function injectActionRunner(): ActionRunner {
  const toastService = inject(ToastService);
  const destroyRef = inject(DestroyRef);

  return (action$, busy, onSuccess, onError) => {
    busy.set(true);

    action$.pipe(takeUntilDestroyed(destroyRef)).subscribe({
      next: (result) => {
        busy.set(false);
        onSuccess(result);
      },
      error: async (error: unknown) => {
        busy.set(false);
        onError?.();
        toastService.error(await readApiErrorMessage(error));
      }
    });
  };
}
