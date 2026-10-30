import { Component, computed, input } from '@angular/core';

import { StatTileTone } from '../../../../shared/components/stat-tile/stat-tile.interface';

// A key figure of the dashboard: "3 / 8" with a thin gauge of the share, and a caption.
@Component({
  selector: 'app-key-figure',
  standalone: true,
  templateUrl: './key-figure.component.html',
  styleUrl: './key-figure.component.scss'
})
export class KeyFigureComponent {
  readonly label = input.required<string>();
  readonly value = input.required<number>();
  // The whole the value is part of; without it, no gauge.
  readonly total = input<number | null>(null);
  readonly caption = input<string>('');
  // Color of the gauge.
  readonly tone = input<StatTileTone>('primary');

  readonly percent = computed(() => {
    const total = this.total();
    return total ? Math.min(100, Math.round((this.value() * 100) / total)) : 0;
  });
}
