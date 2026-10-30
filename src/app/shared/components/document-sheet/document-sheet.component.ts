import { Component, input } from '@angular/core';

// Logo at the top of the sheet: the Ministry (default) or the Republic of Madagascar.
export type DocumentSheetLogo = 'mef' | 'republique';

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
  // Title written first, above the logo (PV de réunion d'ouverture).
  readonly heading = input<string>('');
  readonly logo = input<DocumentSheetLogo>('mef');
}
