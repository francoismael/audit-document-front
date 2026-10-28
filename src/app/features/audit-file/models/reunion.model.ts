import { MissionPersonne, MissionRole } from '../../missions/models/mission-personne.model';

export type ReunionType = 'OUVERTURE' | 'CLOTURE';

export type ParticipantType = 'ENTITE_AUDITEE' | 'EQUIPE_DAI';

export interface ReunionParticipant {
  id: number;
  personneId: number;
  nom: string;
  prenom: string;
  matricule: string | null;
  fonction: string | null;
  service: string | null;
  // Role of the person in the mission when the meeting was saved.
  role: MissionRole | null;
  typeParticipant: ParticipantType;
}

// Times are 'HH:mm:ss' in the responses; 'HH:mm' is accepted in the requests.
export interface Reunion {
  id: number;
  missionId: number;
  missionNumero: string;
  missionIntitule: string;
  type: ReunionType;
  dateReunion: string | null;
  heureDebut: string | null;
  heureFin: string | null;
  heureLevee: string | null;
  lieu: string | null;
  // Opening meeting.
  observations: string | null;
  pointsDaiIntroduction: string | null;
  pointsDaiPresentationMission: string | null;
  pointsDaiMethodologie: string | null;
  pointsInterlocuteursIntroduction: string | null;
  pointsInterlocuteursProcessus: string | null;
  pointsInterlocuteursOrganisation: string | null;
  // Closing meeting.
  remerciements: string | null;
  rappelPerimetre: string | null;
  syntheseConstats: string | null;
  pointsFortsIdentifies: string | null;
  resumeResultatsVerification: string | null;
  resumeRecommandationsPlansActions: string | null;
  observationsCommentaires: string | null;
  participants: ReunionParticipant[];
}

// The opening and closing meetings of a mission (one of each at most).
export interface MissionReunions {
  ouverture: Reunion | null;
  cloture: Reunion | null;
}

export interface ReunionParticipantRequest {
  personneId: number;
  role: MissionRole;
  typeParticipant: ParticipantType;
}

interface ReunionRequestBase {
  missionId: number;
  dateReunion: string | null;
  heureDebut: string | null;
  heureFin: string | null;
  heureLevee: string | null;
  lieu: string | null;
  participants: ReunionParticipantRequest[];
}

export interface OpeningReunionRequest extends ReunionRequestBase {
  type: 'OUVERTURE';
  observations: string | null;
  pointsDaiIntroduction: string | null;
  pointsDaiPresentationMission: string | null;
  pointsDaiMethodologie: string | null;
  pointsInterlocuteursIntroduction: string | null;
  pointsInterlocuteursProcessus: string | null;
  pointsInterlocuteursOrganisation: string | null;
}

export interface ClosingReunionRequest extends ReunionRequestBase {
  type: 'CLOTURE';
  remerciements: string | null;
  rappelPerimetre: string | null;
  syntheseConstats: string | null;
  pointsFortsIdentifies: string | null;
  resumeResultatsVerification: string | null;
  resumeRecommandationsPlansActions: string | null;
  observationsCommentaires: string | null;
}

export type ReunionRequest = OpeningReunionRequest | ClosingReunionRequest;

// "09:30:00" → "09h30".
export function formatReunionTime(time: string | null): string {
  return time ? time.slice(0, 5).replace(':', 'h') : '……';
}

// "Ravelo Tiana, Directeur des RH".
export function describeParticipant(participant: ReunionParticipant): string {
  const name = `${participant.nom} ${participant.prenom}`;
  return participant.fonction ? `${name}, ${participant.fonction}` : name;
}

export function participantsOfType(reunion: Reunion | null, type: ParticipantType): ReunionParticipant[] {
  return (reunion?.participants ?? []).filter((participant) => participant.typeParticipant === type);
}

export function participantIds(reunion: Reunion, type: ParticipantType): number[] {
  return participantsOfType(reunion, type).map((participant) => participant.personneId);
}

// The checked members of one side, with their role in the mission.
export function toParticipantRequests(
  members: MissionPersonne[],
  selected: Set<number>,
  type: ParticipantType
): ReunionParticipantRequest[] {
  return members
    .filter((member) => selected.has(member.personneId))
    .map((member) => ({ personneId: member.personneId, role: member.roles, typeParticipant: type }));
}
