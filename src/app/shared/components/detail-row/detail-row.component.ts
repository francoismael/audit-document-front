import { Component, input } from '@angular/core';

// One "label: value" line of a detail view. The value is the projected content.
@Component({
  selector: 'app-detail-row',
  standalone: true,
  templateUrl: './detail-row.component.html',
  styleUrl: './detail-row.component.scss'
})
export class DetailRowComponent {
  readonly label = input.required<string>();
}
