import { Injectable, computed, inject, signal } from '@angular/core';
import { Observable, catchError, forkJoin, from, map, of, switchMap } from 'rxjs';

import { readApiErrorMessage } from '../../../core/http/api-error';
import { MissionPersonne, MissionRole } from '../../missions/models/mission-personne.model';
import { Mission } from '../../missions/models/mission.model';
import { MissionService } from '../../missions/services/mission.service';
import { AuditTest } from '../models/audit-test.model';
import { Constat } from '../models/constat.model';
import { DeclarationIndependance } from '../models/declaration-independance.model';
import { Interview } from '../models/interview.model';
import { ProgrammeTravail } from '../models/programme-travail.model';
import { PvAffirmation } from '../models/pv-affirmation.model';
import { RapportAudit } from '../models/rapport-audit.model';
import { Reunion } from '../models/reunion.model';
import { TableauRecommandations } from '../models/tableau-recommandations.model';
import { Tdr } from '../models/tdr.model';
import { AuditTestService } from './audit-test.service';
import { ConstatService } from './constat.service';
import { DeclarationIndependanceService } from './declaration-independance.service';
import { InterviewService } from './interview.service';
import { ProgrammeTravailService } from './programme-travail.service';
import { PvAffirmationService } from './pv-affirmation.service';
import { RapportAuditService } from './rapport-audit.service';
import { ReunionService } from './reunion.service';
import { TableauRecommandationsService } from './tableau-recommandations.service';
import { TdrService } from './tdr.service';

interface AuditFileDocuments {
  mission: Mission;
  tdr: Tdr | null;
  declarations: DeclarationIndependance[];
  openingReunion: Reunion | null;
  interviews: Interview[];
  programme: ProgrammeTravail | null;
  tests: AuditTest[];
  constats: Constat[];
  pvAffirmation: PvAffirmation | null;
  rapport: RapportAudit | null;
  closingReunion: Reunion | null;
  tableauRecommandations: TableauRecommandations | null;
}

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
  private readonly interviewService = inject(InterviewService);
  private readonly programmeService = inject(ProgrammeTravailService);
  private readonly testService = inject(AuditTestService);
  private readonly constatService = inject(ConstatService);
  private readonly pvAffirmationService = inject(PvAffirmationService);
  private readonly rapportService = inject(RapportAuditService);
  private readonly tableauService = inject(TableauRecommandationsService);

  readonly mission = signal<Mission | null>(null);
  readonly tdr = signal<Tdr | null>(null);
  readonly declarations = signal<DeclarationIndependance[]>([]);
  readonly openingReunion = signal<Reunion | null>(null);
  readonly interviews = signal<Interview[]>([]);
  readonly programme = signal<ProgrammeTravail | null>(null);
  readonly tests = signal<AuditTest[]>([]);
  readonly constats = signal<Constat[]>([]);
  readonly pvAffirmation = signal<PvAffirmation | null>(null);
  readonly rapport = signal<RapportAudit | null>(null);
  readonly closingReunion = signal<Reunion | null>(null);
  readonly tableauRecommandations = signal<TableauRecommandations | null>(null);
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
  readonly declarants = computed(() => uniquePersons(this.auditors()));

  // Every person of the mission once (interviewee, visas...).
  readonly people = computed(() => uniquePersons(this.mission()?.personnes ?? []));

  load(missionId: number): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.missionService
      .getById(missionId)
      .pipe(
        switchMap((mission) => this.fetchDocuments(mission)),
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
          this.interviews.set(result.interviews);
          this.programme.set(result.programme);
          this.tests.set(result.tests);
          this.constats.set(result.constats);
          this.pvAffirmation.set(result.pvAffirmation);
          this.rapport.set(result.rapport);
          this.closingReunion.set(result.closingReunion);
          this.tableauRecommandations.set(result.tableauRecommandations);
        }

        this.loading.set(false);
      });
  }

  membersWithRole(role: MissionRole): MissionPersonne[] {
    return (this.mission()?.personnes ?? []).filter((member) => member.roles === role);
  }

  // Tests and constats have no mission id: they are found through the programme lines, then the tests.
  private fetchDocuments(mission: Mission): Observable<AuditFileDocuments> {
    return forkJoin({
      tdr: this.tdrService.getByMission(mission.id),
      declarations: this.declarationService.getByMission(mission.id),
      reunions: this.reunionService.getByMission(mission.id),
      interviews: this.interviewService.getByMission(mission.id),
      programme: this.programmeService.getByMission(mission.id),
      pvAffirmation: this.pvAffirmationService.getByMission(mission.id),
      rapport: this.rapportService.getByMission(mission.id),
      tableauRecommandations: this.tableauService.getByMission(mission.id)
    }).pipe(
      switchMap(({ reunions, ...documents }) => {
        const lineIds = documents.programme?.lignes.map((ligne) => ligne.id) ?? [];
        const tests$ = lineIds.length > 0 ? this.testService.getByProgrammeLines(lineIds) : of([]);

        return tests$.pipe(
          switchMap((tests) => {
            const constats$ = tests.length > 0 ? this.constatService.getByTests(tests.map((test) => test.id)) : of([]);
            return constats$.pipe(
              map((constats) => ({
                ...documents,
                mission,
                openingReunion: reunions.ouverture,
                closingReunion: reunions.cloture,
                tests,
                constats
              }))
            );
          })
        );
      })
    );
  }
}

// One entry per person, even when the person has several roles in the mission (the first membership is kept).
export function uniquePersons(members: MissionPersonne[]): MissionPersonne[] {
  const seen = new Set<number>();

  return members.filter((member) => {
    if (seen.has(member.personneId)) {
      return false;
    }

    seen.add(member.personneId);
    return true;
  });
}
