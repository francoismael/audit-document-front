export type GeneratedDocumentValue = string | number | boolean | null;

export interface GeneratedDocument {
  id: number;
  documentTypeId: number;
  documentTypeCode: string;
  documentTypeNom: string;
  missionId: number | null;
  missionNumero: string | null;
  missionIntitule: string | null;
  nomFichier: string;
  taille: number;
  templateVersion: number | null;
  dateGeneration: string;
  valeurs: Record<string, GeneratedDocumentValue>;
}
