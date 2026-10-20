import { GeneratedDocument } from '../../document-history/models/generated-document.model';

export interface Statistics {
  nombreMissions: number;
  missionsEnCours: number;
  missionsAVenir: number;
  missionsTerminees: number;
  missionsSansDates: number;
  nombreTypesDocuments: number;
  nombreTypesActifs: number;
  nombreDocumentsGeneres: number;
  documentsParType: DocumentTypeStatistic[];
  documentsParMois: MonthStatistic[];
  derniersDocuments: GeneratedDocument[];
}

export interface DocumentTypeStatistic {
  documentTypeId: number;
  code: string;
  nom: string;
  nombre: number;
}

export interface MonthStatistic {
  mois: string;
  nombre: number;
}

export interface MissionProgress {
  missionId: number;
  missionNumero: string;
  missionIntitule: string;
  documentsCompletes: number;
  documentsAttendus: number;
  pourcentage: number;
  tdr: boolean;
  programme: boolean;
  tests: boolean;
  constats: boolean;
  rapport: boolean;
  pvAffirmation: boolean;
  pvCloture: boolean;
}
