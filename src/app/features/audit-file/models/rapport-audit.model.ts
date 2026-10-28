export type RapportVersion = 'provisoire' | 'definitif';

export const RAPPORT_VERSION_LABELS: Record<RapportVersion, string> = {
  provisoire: 'Provisoire',
  definitif: 'Définitif'
};

// The three classifications of the cover page of Document.docx.
export const RAPPORT_CLASSIFICATIONS: string[] = [
  'Non public',
  'Réservé aux Autorités Supérieures',
  "Réservé à l'entité auditée"
];

export interface RapportAudit {
  rapportId: number;
  missionId: number;
  missionNumero: string;
  missionIntitule: string;
  missionObjet: string | null;
  missionDateSignature: string | null;
  structureId: number | null;
  structureNom: string | null;
  // "RAPPORT D'AUDIT SUR <objet of the mission>", built by the backend.
  titre: string;
  motifs: string | null;
  nature: string | null;
  referenceOm: string;
  dateOm: string | null;
  versionRapport: string;
  dateEmission: string | null;
  proprietaireDocument: string | null;
  // One recipient per line.
  destinataires: string | null;
  classification: string | null;
}

export interface RapportAuditRequest {
  missionId: number;
  motifs: string | null;
  nature: string | null;
  versionRapport: RapportVersion;
  dateEmission: string | null;
  proprietaireDocument: string | null;
  destinataires: string | null;
  classification: string | null;
}
