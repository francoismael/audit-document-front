import { DynamicFieldType } from '../../../shared/interfaces/dynamic-field.interface';

export interface DocumentField {
  id: number;
  documentTypeId: number;
  documentTypeNom: string;
  nom: string;
  libelle: string;
  type: DynamicFieldType;
  obligatoire: boolean;
  ordre: number;
}

export interface DocumentFieldRequest {
  documentTypeId: number;
  nom: string;
  libelle: string;
  type: DynamicFieldType;
  obligatoire: boolean;
}
