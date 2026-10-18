import { Injectable, signal } from '@angular/core';

import { Toast, ToastType } from '../../shared/interfaces/toast.interface';

const TOAST_DURATION_MS = 4000;

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private readonly toastList = signal<Toast[]>([]);
  private nextId = 0;

  readonly toasts = this.toastList.asReadonly();

  success(message: string): void {
    this.show('success', message);
  }

  error(message: string): void {
    this.show('error', message);
  }

  warning(message: string): void {
    this.show('warning', message);
  }

  info(message: string): void {
    this.show('info', message);
  }

  dismiss(id: number): void {
    this.toastList.update((toasts) => toasts.filter((toast) => toast.id !== id));
  }

  private show(type: ToastType, message: string): void {
    const id = this.nextId++;

    this.toastList.update((toasts) => [...toasts, { id, type, message }]);
    setTimeout(() => this.dismiss(id), TOAST_DURATION_MS);
  }
}
