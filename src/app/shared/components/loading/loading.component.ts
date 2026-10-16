import { Component, input } from '@angular/core';

@Component({
  selector: 'app-loading',
  standalone: true,
  templateUrl: './loading.component.html',
  styleUrl: './loading.component.scss'
})
export class LoadingComponent {
  readonly message = input<string>('Chargement en cours...');
  readonly size = input<'sm' | 'md' | 'lg'>('md');
  readonly fullPage = input<boolean>(false);
}
