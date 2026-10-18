import { Component, computed, input, output } from '@angular/core';

import { ToastType } from '../../interfaces/toast.interface';

const ICONS: Record<ToastType, string> = {
  success: '✓',
  warning: '!',
  error: '×',
  info: 'i'
};

@Component({
  selector: 'app-toast',
  standalone: true,
  templateUrl: './toast.component.html',
  styleUrl: './toast.component.scss'
})
export class ToastComponent {
  readonly type = input<ToastType>('info');
  readonly message = input.required<string>();
  readonly closable = input<boolean>(false);

  readonly closed = output<void>();

  readonly icon = computed(() => ICONS[this.type()]);
}
