import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ButtonComponent } from './shared/components/button/button.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    RouterOutlet,
    ButtonComponent
  ],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'audit-document-front';

  save(): void {
    console.log('Enregistrement demandé');
  }

  cancel(): void {
    console.log('Annulation demandée');
  }

  validate(): void {
    console.log('Validation demandée');
  }
}