import { Component, computed, inject, input, linkedSignal, output, signal } from '@angular/core';
import { catchError, of } from 'rxjs';

import { injectActionRunner } from '../../../../core/http/action-runner';
import { ButtonComponent } from '../../../../shared/components/button/button.component';
import { FormFieldComponent } from '../../../../shared/components/form-field/form-field.component';
import { IconButtonComponent } from '../../../../shared/components/icon-button/icon-button.component';
import { ModalComponent } from '../../../../shared/components/modal/modal.component';
import { SelectFieldComponent } from '../../../../shared/components/select-field/select-field.component';
import { SelectFieldOption } from '../../../../shared/components/select-field/select-field.interface';
import { TextareaFieldComponent } from '../../../../shared/components/textarea-field/textarea-field.component';
import { MISSION_ROLES, MISSION_ROLE_LABELS } from '../../models/mission-labels';
import { MissionRole } from '../../models/mission-personne.model';
import { Mission, MissionRequest } from '../../models/mission.model';
import { Personne, PersonneRequest } from '../../models/personne.model';
import { Structure, StructureRequest } from '../../models/structure.model';
import { PersonneService } from '../../services/personne.service';
import { StructureService } from '../../services/structure.service';
import { PersonneQuickModalComponent } from '../personne-quick-modal/personne-quick-modal.component';
import { StructureQuickModalComponent } from '../structure-quick-modal/structure-quick-modal.component';

// Size of the intitule column.
const INTITULE_MAX_LENGTH = 500;

interface TeamMember {
  personneId: number;
  roles: MissionRole;
}

@Component({
  selector: 'app-mission-form-modal',
  standalone: true,
  imports: [
    ButtonComponent,
    FormFieldComponent,
    IconButtonComponent,
    ModalComponent,
    PersonneQuickModalComponent,
    SelectFieldComponent,
    StructureQuickModalComponent,
    TextareaFieldComponent
  ],
  templateUrl: './mission-form-modal.component.html',
  styleUrl: './mission-form-modal.component.scss'
})
export class MissionFormModalComponent {
  private readonly structureService = inject(StructureService);
  private readonly personneService = inject(PersonneService);
  private readonly runAction = injectActionRunner();

  readonly open = input<boolean>(false);
  // Null to create a mission, a mission to edit it.
  readonly mission = input<Mission | null>(null);
  readonly saving = input<boolean>(false);

  readonly submitted = output<MissionRequest>();
  readonly cancelled = output<void>();

  readonly structures = signal<Structure[]>([]);
  readonly personnes = signal<Personne[]>([]);

  // Reset every time the modal opens, from the edited mission or empty.
  readonly intitule = linkedSignal(() => (this.open() ? this.mission()?.intitule ?? '' : ''));
  readonly objet = linkedSignal(() => (this.open() ? this.mission()?.objet ?? '' : ''));
  readonly dateDebut = linkedSignal(() => (this.open() ? this.mission()?.dateDebut ?? '' : ''));
  readonly dateFin = linkedSignal(() => (this.open() ? this.mission()?.dateFin ?? '' : ''));
  readonly dateSignature = linkedSignal(() => (this.open() ? this.mission()?.dateSignature ?? '' : ''));
  readonly structureId = linkedSignal(() => (this.open() ? String(this.mission()?.structureId ?? '') : ''));
  readonly team = linkedSignal<TeamMember[]>(() =>
    this.open()
      ? (this.mission()?.personnes ?? []).map((member) => ({ personneId: member.personneId, roles: member.roles }))
      : []
  );
  readonly newMemberId = linkedSignal(() => this.emptyOnOpen());
  readonly newMemberRole = linkedSignal(() => this.emptyOnOpen());
  readonly memberError = linkedSignal<string | null>(() => {
    this.open();
    return null;
  });
  readonly showErrors = linkedSignal(() => {
    this.open();
    return false;
  });

  readonly structureFormOpen = signal<boolean>(false);
  readonly savingStructure = signal<boolean>(false);
  readonly personneFormOpen = signal<boolean>(false);
  readonly savingPersonne = signal<boolean>(false);

  readonly title = computed(() => {
    const mission = this.mission();
    return mission ? `Modifier la mission n° ${mission.numero}` : 'Nouvelle mission';
  });
  readonly subtitle = computed(
    () => this.mission()?.intitule ?? "Le numéro est attribué automatiquement. C'est l'ordre de mission."
  );
  readonly confirmText = computed(() => (this.mission() ? 'Enregistrer' : 'Créer la mission'));

  readonly structureOptions = computed<SelectFieldOption[]>(() =>
    this.structures().map((structure) => ({ value: String(structure.id), label: structure.nom }))
  );
  readonly personneOptions = computed<SelectFieldOption[]>(() =>
    this.personnes().map((personne) => ({ value: String(personne.id), label: this.describePersonne(personne) }))
  );
  readonly roleOptions: SelectFieldOption[] = MISSION_ROLES.map((role) => ({
    value: role,
    label: MISSION_ROLE_LABELS[role]
  }));
  readonly roleLabels = MISSION_ROLE_LABELS;

  // Sorted by role, in the order of the hierarchy.
  readonly teamRows = computed(() =>
    [...this.team()]
      .sort((first, second) => MISSION_ROLES.indexOf(first.roles) - MISSION_ROLES.indexOf(second.roles))
      .map((member) => ({
        ...member,
        personne: this.personnes().find((personne) => personne.id === member.personneId) ?? null
      }))
  );

  readonly intituleError = computed(() => {
    const intitule = this.intitule().trim();

    if (!intitule) {
      return "L'intitulé est obligatoire.";
    }

    return intitule.length > INTITULE_MAX_LENGTH ? `${INTITULE_MAX_LENGTH} caractères maximum.` : null;
  });
  readonly structureError = computed(() => (this.structureId() ? null : 'Choisissez la structure auditée.'));
  readonly dateFinError = computed(() =>
    this.dateDebut() && this.dateFin() && this.dateFin() < this.dateDebut()
      ? 'La date de fin doit être après la date de début.'
      : null
  );

  readonly visibleIntituleError = computed(() => (this.showErrors() ? this.intituleError() : null));
  readonly visibleStructureError = computed(() => (this.showErrors() ? this.structureError() : null));
  readonly visibleDateFinError = computed(() => (this.showErrors() ? this.dateFinError() : null));

  constructor() {
    // The lists stay usable without network errors blocking the form: an empty list just shows no option.
    this.structureService
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe((structures) => this.structures.set(structures));

    this.personneService
      .getAll()
      .pipe(catchError(() => of([])))
      .subscribe((personnes) => this.personnes.set(personnes));
  }

  addMember(): void {
    const personneId = Number(this.newMemberId());
    const role = this.newMemberRole() as MissionRole;

    if (!personneId || !role) {
      this.memberError.set('Choisissez une personne et son rôle.');
      return;
    }

    if (this.team().some((member) => member.personneId === personneId && member.roles === role)) {
      this.memberError.set('Cette personne a déjà ce rôle dans la mission.');
      return;
    }

    this.team.update((team) => [...team, { personneId, roles: role }]);
    this.newMemberId.set('');
    this.memberError.set(null);
  }

  removeMember(member: TeamMember): void {
    this.team.update((team) =>
      team.filter((item) => item.personneId !== member.personneId || item.roles !== member.roles)
    );
  }

  createStructure(request: StructureRequest): void {
    this.runAction(this.structureService.create(request), this.savingStructure, (structure) => {
      this.structures.update((structures) => [...structures, structure]);
      this.structureId.set(String(structure.id));
      this.structureFormOpen.set(false);
    });
  }

  createPersonne(request: PersonneRequest): void {
    this.runAction(this.personneService.create(request), this.savingPersonne, (personne) => {
      this.personnes.update((personnes) => [...personnes, personne]);
      this.newMemberId.set(String(personne.id));
      this.personneFormOpen.set(false);

      // With a role already chosen, the new person joins the team right away.
      if (this.newMemberRole()) {
        this.addMember();
      }
    });
  }

  onConfirm(): void {
    this.showErrors.set(true);

    if (this.intituleError() || this.structureError() || this.dateFinError()) {
      return;
    }

    this.submitted.emit({
      intitule: this.intitule().trim(),
      objet: this.objet().trim() || null,
      dateDebut: this.dateDebut() || null,
      dateFin: this.dateFin() || null,
      dateSignature: this.dateSignature() || null,
      structureId: Number(this.structureId()),
      personnes: this.team()
    });
  }

  describePersonne(personne: Personne): string {
    const name = `${personne.nom} ${personne.prenom}`;
    return personne.fonction ? `${name} — ${personne.fonction}` : name;
  }

  private emptyOnOpen(): string {
    this.open();
    return '';
  }
}
