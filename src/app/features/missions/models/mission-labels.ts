import { StatusBadgeStatus } from '../../../shared/components/status-badge/status-badge.interface';
import { Mission } from './mission.model';
import { MissionRole } from './mission-personne.model';

// In the order of the hierarchy, used to group the team.
export const MISSION_ROLES: MissionRole[] = [
  'DIRECTEUR_AUDIT_INTERNE',
  'CHEF_MISSION',
  'SUPERVISEUR',
  'AUDITEUR',
  'POINT_FOCAL'
];

export const MISSION_ROLE_LABELS: Record<MissionRole, string> = {
  DIRECTEUR_AUDIT_INTERNE: "Directeur de l'audit interne",
  CHEF_MISSION: 'Chef de mission',
  SUPERVISEUR: 'Superviseur',
  AUDITEUR: 'Auditeur',
  POINT_FOCAL: "Point focal (entité auditée)"
};

export type MissionStatus = 'upcoming' | 'ongoing' | 'finished' | 'undated';

export const MISSION_STATUS_LABELS: Record<MissionStatus, string> = {
  upcoming: 'À venir',
  ongoing: 'En cours',
  finished: 'Terminée',
  undated: 'Sans dates'
};

export const MISSION_STATUS_BADGES: Record<MissionStatus, StatusBadgeStatus> = {
  upcoming: 'pending',
  ongoing: 'in-progress',
  finished: 'completed',
  undated: 'draft'
};

// Same rule as the backend statistics. Dates are compared as 'yyyy-MM-dd' strings.
export function getMissionStatus(mission: Pick<Mission, 'dateDebut' | 'dateFin'>, today: string): MissionStatus {
  if (mission.dateFin && mission.dateFin < today) {
    return 'finished';
  }

  if (mission.dateDebut && mission.dateDebut > today) {
    return 'upcoming';
  }

  return mission.dateDebut ? 'ongoing' : 'undated';
}

// Reference of the mission order, "005-2026-MEF/DAI": the year of the signature, or the current year.
export function ordreMissionReference(mission: Pick<Mission, 'numero' | 'dateSignature'>): string {
  const year = mission.dateSignature ? mission.dateSignature.slice(0, 4) : String(new Date().getFullYear());
  return `${mission.numero}-${year}-MEF/DAI`;
}

// Today in the format of the API dates (yyyy-MM-dd), in local time.
export function todayAsText(): string {
  const today = new Date();
  const month = String(today.getMonth() + 1).padStart(2, '0');
  const day = String(today.getDate()).padStart(2, '0');

  return `${today.getFullYear()}-${month}-${day}`;
}
