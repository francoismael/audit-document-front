
import { Component, input } from '@angular/core';

import { CardPadding, CardVariant } from './card.interface';

@Component({
  selector: 'app-card',
  standalone: true,
  templateUrl: './card.component.html',
  styleUrl: './card.component.scss'
})
export class CardComponent {
  readonly title = input<string>('');
  readonly description = input<string>('');
  readonly variant = input<CardVariant>('default');
  readonly padding = input<CardPadding>('md');
}
