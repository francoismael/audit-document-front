import { Component, computed, input, output, signal } from '@angular/core';
import { SearchInputComponent } from '../search-input/search-input.component';
import { SelectFieldComponent } from '../select-field/select-field.component';
import { SelectFieldConfig } from '../select-field/select-field.interface';
import {
  FilterBarCriteria,
  FilterBarStatusOption
} from './filter-bar.interface';

@Component({
  selector: 'app-filter-bar',
  standalone: true,
  imports: [SearchInputComponent, SelectFieldComponent],
  templateUrl: './filter-bar.component.html',
  styleUrl: './filter-bar.component.scss'
})
export class FilterBarComponent {
  readonly statuses = input<FilterBarStatusOption[]>([
    { label: 'Tous les statuts', value: '' },
    { label: 'En attente', value: 'pending' },
    { label: 'En cours', value: 'in-progress' },
    { label: 'Validé', value: 'approved' },
    { label: 'Terminé', value: 'completed' },
    { label: 'Rejeté', value: 'rejected' }
  ]);

  readonly placeholder = input<string>(
    'Rechercher par référence ou intitulé...'
  );

  readonly showDateFilters = input<boolean>(true);

  readonly filtersChange = output<FilterBarCriteria>();

  readonly search = signal('');
  readonly status = signal('');
  readonly dateFrom = signal('');
  readonly dateTo = signal('');

  readonly statusConfig = computed<SelectFieldConfig>(() => ({
    label: 'Statut',
    placeholder: 'Tous les statuts',
    options: this.statuses(),
    required: false
  }));

  onSearchChange(value: string): void {
    this.search.set(value);
    this.emitFilters();
  }

  onStatusChange(value: string): void {
    this.status.set(value);
    this.emitFilters();
  }

  onDateFromChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.dateFrom.set(target.value);
      this.emitFilters();
    }
  }

  onDateToChange(event: Event): void {
    const target = event.target;

    if (target instanceof HTMLInputElement) {
      this.dateTo.set(target.value);
      this.emitFilters();
    }
  }

  resetFilters(): void {
    this.search.set('');
    this.status.set('');
    this.dateFrom.set('');
    this.dateTo.set('');

    this.emitFilters();
  }

  private emitFilters(): void {
    this.filtersChange.emit({
      search: this.search().trim(),
      status: this.status(),
      dateFrom: this.dateFrom(),
      dateTo: this.dateTo()
    });
  }
}