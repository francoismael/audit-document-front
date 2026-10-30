export type GeneratedDocumentValue = string | number | boolean | null;

export interface GeneratedDocument {
  id: number;
  // Null once the type is deleted: the document keeps the code and the name of its type.
  documentTypeId: number | null;
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

// "Fiche de suivi", or "Fiche de suivi (type supprimé)" when the type no longer exists.
export function documentTypeLabel(document: GeneratedDocument): string {
  return document.documentTypeId === null ? `${document.documentTypeNom} (type supprimé)` : document.documentTypeNom;
}
