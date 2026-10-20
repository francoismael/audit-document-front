export type MissionRole =
  | 'DIRECTEUR_AUDIT_INTERNE'
  | 'CHEF_MISSION'
  | 'SUPERVISEUR'
  | 'AUDITEUR'
  | 'POINT_FOCAL';

export interface MissionPersonne {
  missionPersonneId: number;
  personneId: number;
  nom: string;
  prenom: string;
  fonction: string | null;
  services: string | null;
  roles: MissionRole;
}
