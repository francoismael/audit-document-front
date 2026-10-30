import { Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

import { StatTileTone } from './stat-tile.interface';

// Key figure of a dashboard: an icon, a label, a large value and an optional hint below.
@Component({
  selector: 'app-stat-tile',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './stat-tile.component.html',
  styleUrl: './stat-tile.component.scss'
})
export class StatTileComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  // Material icon name.
  readonly icon = input.required<string>();
  readonly hint = input<string>('');
  readonly tone = input<StatTileTone>('primary');
}
