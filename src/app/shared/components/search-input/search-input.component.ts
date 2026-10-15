import { Component, input, output } from '@angular/core';

@Component({
  selector: 'app-search-input',
  standalone: true,
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss'
})
export class SearchInputComponent {
  readonly placeholder = input<string>('Rechercher...');
  readonly value = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly id = input.required<string>();

  readonly valueChange = output<string>();
  readonly search = output<string>();

  onValueInput(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.valueChange.emit(target.value);
    }
  }

  onSearch(): void {
    this.search.emit(this.value().trim());
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.onSearch();
    }
  }

  clearSearch(): void {
    this.valueChange.emit('');
    this.search.emit('');
  }
}