import { Component, input, output } from '@angular/core';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { CheckboxFieldComponent } from '../../../../shared/components/checkbox-field/checkbox-field.component';
import { MISSION_ROLE_LABELS } from '../../../missions/models/mission-labels';
import { MissionPersonne } from '../../../missions/models/mission-personne.model';
import { ParticipantType } from '../../models/reunion.model';

export interface AttendeeToggle {
  type: ParticipantType;
  personneId: number;
  checked: boolean;
}

// Attendees of an opening or closing meeting: points focaux on one side, the DAI team on the other.
@Component({
  selector: 'app-reunion-attendees',
  standalone: true,
  imports: [ButtonComponent, CheckboxFieldComponent],
  templateUrl: './reunion-attendees.component.html',
  styleUrl: './reunion-attendees.component.scss'
})
export class ReunionAttendeesComponent {
  readonly idPrefix = input.required<string>();
  readonly entiteMembers = input.required<MissionPersonne[]>();
  readonly daiMembers = input.required<MissionPersonne[]>();
  readonly selectedEntite = input.required<Set<number>>();
  readonly selectedDai = input.required<Set<number>>();

  readonly toggled = output<AttendeeToggle>();
  readonly editMission = output<void>();

  readonly roleLabels = MISSION_ROLE_LABELS;
}
