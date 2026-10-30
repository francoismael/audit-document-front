import { Component, DestroyRef, inject, input, linkedSignal, output, signal } from '@angular/core';

// Pause after the last key before the search is applied.
const SEARCH_DELAY_MS = 300;

@Component({
  selector: 'app-search-input',
  standalone: true,
  templateUrl: './search-input.component.html',
  styleUrl: './search-input.component.scss'
})
export class SearchInputComponent {
  // Text shown above the field, like the label of the other fields.
  readonly label = input<string>('Rechercher');
  readonly placeholder = input<string>('Rechercher...');
  readonly value = input<string>('');
  readonly disabled = input<boolean>(false);
  readonly id = input.required<string>();
  // Shows the loader while the page loads its results (for example after a filter change).
  readonly loading = input<boolean>(false);

  // Every key, immediately.
  readonly valueChange = output<string>();
  // The trimmed text, once the user stops typing (or presses Enter).
  readonly search = output<string>();

  readonly text = linkedSignal(() => this.value());
  readonly waiting = signal<boolean>(false);

  private timer: ReturnType<typeof setTimeout> | null = null;

  constructor() {
    inject(DestroyRef).onDestroy(() => this.cancelTimer());
  }

  onValueInput(event: Event): void {
    const target = event.target;

    if (!(target instanceof HTMLInputElement)) {
      return;
    }

    this.text.set(target.value);
    this.valueChange.emit(target.value);
    this.cancelTimer();
    this.waiting.set(true);
    this.timer = setTimeout(() => this.emitSearch(), SEARCH_DELAY_MS);
  }

  onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      event.preventDefault();
      this.emitSearch();
    }
  }

  clearSearch(): void {
    this.text.set('');
    this.valueChange.emit('');
    this.emitSearch();
  }

  private emitSearch(): void {
    this.cancelTimer();
    this.waiting.set(false);
    this.search.emit(this.text().trim());
  }

  private cancelTimer(): void {
    if (this.timer !== null) {
      clearTimeout(this.timer);
      this.timer = null;
    }
  }
}
