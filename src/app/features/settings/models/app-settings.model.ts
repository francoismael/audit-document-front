import { DynamicFieldType } from '../../../shared/interfaces/dynamic-field.interface';
import { MissionRole } from '../../missions/models/mission-personne.model';

export interface AppSettings {
  nomApplication: string;
  dossierModeles: string;
  dossierDocumentsGeneres: string;
  tailleMaxFichier: string;
  formatsModeles: string[];
  formatsGeneration: string[];
  syntaxeVariables: string;
  typesChamps: DynamicFieldType[];
  rolesMission: MissionRole[];
}
