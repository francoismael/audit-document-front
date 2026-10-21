
import { Component, computed, input } from '@angular/core';

import {
  StatusBadgeSize,
  StatusBadgeStatus
} from './status-badge.interface';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.scss'
})
export class StatusBadgeComponent {
  readonly status = input.required<StatusBadgeStatus>();
  readonly size = input<StatusBadgeSize>('md');
  // Replaces the default label while keeping the colors of the status (for example "Actif").
  readonly customLabel = input<string>('', { alias: 'label' });

  readonly label = computed(() => {
    if (this.customLabel()) {
      return this.customLabel();
    }

    const labels: Record<StatusBadgeStatus, string> = {
      draft: 'Brouillon',
      pending: 'En attente',
      'in-progress': 'En cours',
      approved: 'Validé',
      completed: 'Terminé',
      rejected: 'Rejeté',
      cancelled: 'Annulé'
    };

    return labels[this.status()];
  });
}
