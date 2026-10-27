import { Component, input, output } from '@angular/core';

// One card of the list of a document split (a declaration, an interview, a test...). Its actions are projected.
@Component({
  selector: 'li[app-document-list-item]',
  standalone: true,
  templateUrl: './document-list-item.component.html',
  styleUrl: './document-list-item.component.scss',
  host: {
    class: 'document-list-item',
    '[class.document-list-item-selected]': 'selected()'
  }
})
export class DocumentListItemComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>('');
  // Short state under the title: "Signée le …", "Ineffectif"...
  readonly state = input<string>('');
  readonly stateDone = input<boolean>(false);
  readonly selected = input<boolean>(false);

  readonly chosen = output<void>();
}
