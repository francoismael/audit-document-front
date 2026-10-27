import { MissionRole } from '../../missions/models/mission-personne.model';

// AUDITEUR: the audit team; ENTITE_AUDITEE: a point focal of the audited entity.
export type AffirmationParticipantType = 'AUDITEUR' | 'ENTITE_AUDITEE';

export interface PvAffirmationParticipant {
  id: number;
  missionPersonneId: number;
  personneId: number;
  nom: string;
  prenom: string;
  fonction: string | null;
  roles: MissionRole;
  typeParticipant: AffirmationParticipantType;
}

export interface PvAffirmationLigne {
  id: number;
  constatId: number;
  referenceConstat: string;
  question: string;
  reponseEntite: string | null;
  piecesJustificatives: string | null;
  commentairesAuditeurs: string | null;
}

export interface PvAffirmation {
  id: number;
  missionId: number;
  missionNumero: string;
  missionIntitule: string;
  missionObjet: string | null;
  structureNom: string | null;
  dateEntretien: string;
  lieu: string | null;
  observationsComplementaires: string | null;
  participants: PvAffirmationParticipant[];
  lignes: PvAffirmationLigne[];
}

export interface PvAffirmationParticipantRequest {
  missionPersonneId: number;
  typeParticipant: AffirmationParticipantType;
}

export interface PvAffirmationLigneRequest {
  constatId: number;
  question: string;
  reponseEntite: string | null;
  piecesJustificatives: string | null;
  commentairesAuditeurs: string | null;
}

export interface PvAffirmationRequest {
  missionId: number;
  dateEntretien: string;
  lieu: string | null;
  observationsComplementaires: string | null;
  participants: PvAffirmationParticipantRequest[];
  lignes: PvAffirmationLigneRequest[];
}
