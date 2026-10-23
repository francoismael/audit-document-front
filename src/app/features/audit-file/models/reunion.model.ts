import { MissionRole } from '../../missions/models/mission-personne.model';

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
  observations: string | null;
  pointsDaiIntroduction: string | null;
  pointsDaiPresentationMission: string | null;
  pointsDaiMethodologie: string | null;
  pointsInterlocuteursIntroduction: string | null;
  pointsInterlocuteursProcessus: string | null;
  pointsInterlocuteursOrganisation: string | null;
  participants: ReunionParticipant[];
}

export interface ReunionParticipantRequest {
  personneId: number;
  role: MissionRole;
  typeParticipant: ParticipantType;
}

// Opening meeting: the closing meeting fields (step 21) are left out.
export interface OpeningReunionRequest {
  missionId: number;
  type: 'OUVERTURE';
  dateReunion: string | null;
  heureDebut: string | null;
  heureFin: string | null;
  heureLevee: string | null;
  lieu: string | null;
  observations: string | null;
  pointsDaiIntroduction: string | null;
  pointsDaiPresentationMission: string | null;
  pointsDaiMethodologie: string | null;
  pointsInterlocuteursIntroduction: string | null;
  pointsInterlocuteursProcessus: string | null;
  pointsInterlocuteursOrganisation: string | null;
  participants: ReunionParticipantRequest[];
}
