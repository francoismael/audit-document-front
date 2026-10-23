import { Injectable, computed, inject, signal } from '@angular/core';
import { catchError, forkJoin, from, map, switchMap } from 'rxjs';

import { readApiErrorMessage } from '../../../core/http/api-error';
import { Mission } from '../../missions/models/mission.model';
import { MissionService } from '../../missions/services/mission.service';
import { DeclarationIndependance } from '../models/declaration-independance.model';
import { Reunion } from '../models/reunion.model';
import { Tdr } from '../models/tdr.model';
import { DeclarationIndependanceService } from './declaration-independance.service';
import { ReunionService } from './reunion.service';
import { TdrService } from './tdr.service';

/*
 * Data of the mission workspace, loaded once and shared by the document pages.
 * Provided by MissionWorkspaceComponent: one instance per opened mission.
 */
@Injectable()
export class AuditFileStore {
  private readonly missionService = inject(MissionService);
  private readonly tdrService = inject(TdrService);
  private readonly declarationService = inject(DeclarationIndependanceService);
  private readonly reunionService = inject(ReunionService);

  readonly mission = signal<Mission | null>(null);
  readonly tdr = signal<Tdr | null>(null);
  readonly declarations = signal<DeclarationIndependance[]>([]);
  readonly openingReunion = signal<Reunion | null>(null);
  readonly loading = signal<boolean>(true);
  readonly errorMessage = signal<string | null>(null);

  // The audit team (who signs the declarations), without the points focaux of the audited entity.
  readonly auditors = computed(() =>
    (this.mission()?.personnes ?? []).filter((member) => member.roles !== 'POINT_FOCAL')
  );
  readonly pointsFocaux = computed(() =>
    (this.mission()?.personnes ?? []).filter((member) => member.roles === 'POINT_FOCAL')
  );

  // One declaration per person, even when the person has several roles in the mission.
  readonly declarants = computed(() => {
    const seen = new Set<number>();

    return this.auditors().filter((member) => {
      if (seen.has(member.personneId)) {
        return false;
      }

      seen.add(member.personneId);
      return true;
    });
  });

  load(missionId: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.missionService
      .getById(missionId)
      .pipe(
        switchMap((mission) =>
          forkJoin({
            tdr: this.tdrService.getByMission(missionId),
            declarations: this.declarationService.getByMission(missionId),
            openingReunion: this.reunionService.getByMission(missionId, 'OUVERTURE')
          }).pipe(map((documents) => ({ mission, ...documents })))
        ),
        catchError((error: unknown) => from(readApiErrorMessage(error)).pipe(map((message) => ({ error: message }))))
      )
      .subscribe((result) => {
        if ('error' in result) {
          this.errorMessage.set(result.error);
        } else {
          this.mission.set(result.mission);
          this.tdr.set(result.tdr);
          this.declarations.set(result.declarations);
          this.openingReunion.set(result.openingReunion);
        }

        this.loading.set(false);
      });
  }
}
