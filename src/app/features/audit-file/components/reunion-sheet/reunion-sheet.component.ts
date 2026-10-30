import { formatDate } from '@angular/common';
import { Component, computed, input } from '@angular/core';

import { DocumentSheetComponent } from '../../../../shared/components/document-sheet/document-sheet.component';
import { Reunion, describeParticipant, formatReunionTime, participantsOfType } from '../../models/reunion.model';

// PV of an opening or closing meeting as in Document.docx; the points discussed are projected.
@Component({
  selector: 'app-reunion-sheet',
  standalone: true,
  imports: [DocumentSheetComponent],
  templateUrl: './reunion-sheet.component.html',
  styleUrl: './reunion-sheet.component.scss'
})
export class ReunionSheetComponent {
  readonly reunion = input.required<Reunion>();
  readonly title = input.required<string>();
  readonly objet = input.required<string>();
  // Title first, then the logo of the Republic and the Ministry, date "Antananarivo, le …" (PV d'ouverture).
  readonly officialHeader = input<boolean>(false);

  readonly formatTime = formatReunionTime;
  readonly describe = describeParticipant;

  readonly entiteParticipants = computed(() => participantsOfType(this.reunion(), 'ENTITE_AUDITEE'));
  readonly daiParticipants = computed(() => participantsOfType(this.reunion(), 'EQUIPE_DAI'));

  // "Antananarivo, le 02/11/2026" with the official header, "- 02/11/2026 -" otherwise.
  readonly reference = computed(() => {
    const date = this.reunion().dateReunion;
    const formatted = date ? formatDate(date, 'dd/MM/yyyy', 'en-US') : null;

    return this.officialHeader() ? `Antananarivo, le ${formatted ?? '……………………'}` : `- ${formatted ?? '……'} -`;
  });
}
