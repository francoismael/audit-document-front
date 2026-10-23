import { Component, input } from '@angular/core';

import { ButtonComponent } from '../button/button.component';

// Bar above a business document: title, short state, the page actions (projected) and "Imprimer / PDF".
@Component({
  selector: 'app-document-toolbar',
  standalone: true,
  imports: [ButtonComponent],
  templateUrl: './document-toolbar.component.html',
  styleUrl: './document-toolbar.component.scss'
})
export class DocumentToolbarComponent {
  readonly title = input.required<string>();
  readonly description = input<string>('');
  readonly printable = input<boolean>(true);

  // The print style sheet keeps only the document sheet; the browser offers "Enregistrer en PDF".
  print(): void {
    window.print();
  }
}
