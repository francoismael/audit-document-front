import { MissionPersonne, MissionRole } from './mission-personne.model';
import { Structure } from './structure.model';

export interface Mission {
  id: number;
  numero: string;
  intitule: string;
  objet: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  dateSignature: string | null;
  structureId: number | null;
  structureNom: string | null;
  personnes: MissionPersonne[];
}

export interface MissionRequest {
  intitule: string;
  objet: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  dateSignature: string | null;
  structureId: number | null;
  personnes: MissionTeamMemberRequest[];
}

export interface MissionTeamMemberRequest {
  personneId: number;
  roles: MissionRole;
}

// POST /missions returns the raw entity, which differs from the GET response.
export interface CreatedMission {
  id: number;
  numero: string;
  intitule: string;
  objet: string | null;
  dateDebut: string | null;
  dateFin: string | null;
  dateSignature: string | null;
  structure: Structure | null;
}
