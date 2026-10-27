import { Component, input } from '@angular/core';

// A4 sheet with the official header of the Ministry, used to show and print the business documents.
@Component({
  selector: 'app-document-sheet',
  standalone: true,
  templateUrl: './document-sheet.component.html',
  styleUrl: './document-sheet.component.scss'
})
export class DocumentSheetComponent {
  // Top right corner: place and date, reference number...
  readonly reference = input<string>('');
  // Landscape for the wide tables (work programme), printed on landscape A4 pages.
  readonly orientation = input<'portrait' | 'landscape'>('portrait');
}
