import { DocumentField } from './document-field.model';
import { DocumentTemplate } from './document-template.model';

export interface DocumentType {
  id: number;
  code: string;
  nom: string;
  description: string | null;
  actif: boolean;
  dateCreation: string;
}

export interface DocumentTypeRequest {
  code: string;
  nom: string;
  description: string | null;
}

export interface DocumentTypeForm {
  documentType: DocumentType;
  template: DocumentTemplate | null;
  fields: DocumentField[];
}
