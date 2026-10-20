export interface DocumentTemplate {
  id: number;
  documentTypeId: number;
  documentTypeNom: string;
  nomFichierOriginal: string;
  typeMime: string | null;
  taille: number;
  version: number;
  actif: boolean;
  dateUpload: string;
}

export interface TemplateValidation {
  documentTypeId: number;
  templateId: number;
  templateName: string;
  variablesInTemplate: string[];
  fieldsInDatabase: string[];
  missingFields: string[];
  unknownVariables: string[];
  valid: boolean;
}
