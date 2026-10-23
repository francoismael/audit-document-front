import { DatePipe } from '@angular/common';
import { Component, computed, inject } from '@angular/core';
import { Router } from '@angular/router';

import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { DocumentSheetComponent } from '../../../../shared/components/document-sheet/document-sheet.component';
import { DocumentToolbarComponent } from '../../../../shared/components/document-toolbar/document-toolbar.component';
import { MissionPersonne, MissionRole } from '../../../missions/models/mission-personne.model';
import { AuditFileStore } from '../../services/audit-file.store';

// The mission order is the mission itself: this page only shows it, the mission form changes it.
@Component({
  selector: 'app-ordre-mission-document',
  standalone: true,
  imports: [ButtonComponent, DatePipe, DocumentSheetComponent, DocumentToolbarComponent],
  templateUrl: './ordre-mission-document.component.html',
  styleUrl: './ordre-mission-document.component.scss'
})
export class OrdreMissionDocumentComponent {
  private readonly router = inject(Router);
  readonly store = inject(AuditFileStore);

  readonly mission = this.store.mission;

  readonly chefs = computed(() => this.membersWithRole('CHEF_MISSION'));
  readonly auditeurs = computed(() => this.membersWithRole('AUDITEUR'));
  readonly superviseurs = computed(() => this.membersWithRole('SUPERVISEUR'));
  readonly directeur = computed(() => this.membersWithRole('DIRECTEUR_AUDIT_INTERNE')[0] ?? null);

  // "N° 005-2026-MEF/DAI": the year of the signature, or the current year.
  readonly reference = computed(() => {
    const mission = this.mission();
    const year = mission?.dateSignature ? mission.dateSignature.slice(0, 4) : String(new Date().getFullYear());
    return mission ? `N° ${mission.numero}-${year}-MEF/DAI` : '';
  });

  // "Sous l'égide de X, Directeur de l'Audit Interne, et sous la supervision de Y, fonction ; à effectuer..."
  readonly assignmentText = computed(() => {
    const directeur = this.directeur();
    const supervision = this.superviseurs()
      .map((member) => (member.fonction ? `${this.fullName(member)}, ${member.fonction}` : this.fullName(member)))
      .join(' et ');

    const parts = [
      `Sous l'égide de ${directeur ? this.fullName(directeur) : "[Directeur de l'Audit Interne]"}, Directeur de l'Audit Interne`,
      supervision ? `, et sous la supervision de ${supervision}` : '',
      ` ; à effectuer une mission d'audit « ${this.mission()?.intitule ?? ''} ».`
    ];

    return parts.join('');
  });

  fullName(member: MissionPersonne): string {
    return `${member.nom} ${member.prenom}`;
  }

  editMission(): void {
    const mission = this.mission();

    if (mission) {
      this.router.navigate(['/missions', mission.id]);
    }
  }

  private membersWithRole(role: MissionRole): MissionPersonne[] {
    return (this.mission()?.personnes ?? []).filter((member) => member.roles === role);
  }
}
