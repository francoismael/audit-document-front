import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.scss'
})
export class EmptyStateComponent {
  readonly title = input<string>('Aucun résultat');
  readonly description = input<string>(
    'Aucune donnée disponible pour le moment.'
  );
  readonly icon = input<'search' | 'folder' | 'document' | 'users'>(
    'folder'
  );
  readonly actionLabel = input<string>('');
  readonly actionDisabled = input<boolean>(false);

  readonly action = output<void>();

  onAction(): void {
    if (!this.actionDisabled() && this.actionLabel().trim()) {
      this.action.emit();
    }
  }
}