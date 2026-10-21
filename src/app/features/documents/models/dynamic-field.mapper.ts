import { DynamicField } from '../../../shared/interfaces/dynamic-field.interface';
import { DocumentField } from '../../document-types/models/document-field.model';

// Turns the fields configured in the backend into the fields of the shared dynamic form.
export function toDynamicFields(fields: DocumentField[]): DynamicField[] {
  return [...fields]
    .sort((first, second) => first.ordre - second.ordre)
    .map((field) => ({
      name: field.nom,
      label: field.libelle,
      type: field.type,
      required: field.obligatoire
    }));
}
