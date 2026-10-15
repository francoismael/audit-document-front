
import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';

import { ButtonComponent } from './shared/components/button/button.component';
import { CardComponent } from './shared/components/card/card.component';
import { StatusBadgeComponent } from './shared/components/status-badge/status-badge.component';
import { PageHeaderComponent } from './shared/components/page-header/page-header.component';
import { FormFieldConfig } from './shared/components/form-field/form-field.interface';
import { FormFieldComponent } from './shared/components/form-field/form-field.component';
import { SelectFieldConfig } from './shared/components/select-field/select-field.interface';
import { SelectFieldComponent } from './shared/components/select-field/select-field.component';
import { CheckboxFieldConfig } from './shared/components/checkbox-field/checkbox-field.interface';
import { CheckboxFieldComponent } from './shared/components/checkbox-field/checkbox-field.component';
import { ModalComponent } from './shared/components/modal/modal.component';
import { TextareaFieldConfig } from './shared/components/textarea-field/textarea-field.interface';
import { TextareaFieldComponent } from './shared/components/textarea-field/textarea-field.component';
import { SearchInputComponent } from './shared/components/search-input/search-input.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, ButtonComponent, CardComponent, StatusBadgeComponent, PageHeaderComponent, FormFieldComponent, SelectFieldComponent, CheckboxFieldComponent, ModalComponent, TextareaFieldComponent, SearchInputComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.scss'
})
export class AppComponent {
  title = 'audit-document-front';

searchTerm = '';

onSearchValueChange(value: string): void {
  this.searchTerm = value;
}

onSearch(): void {
  console.log('Recherche lancée :', this.searchTerm.trim());
}

}
