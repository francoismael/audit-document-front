// "Test" in the API: named AuditTest here to avoid any confusion with unit tests.

export type TestResult = 'EFFECTIF' | 'PARTIELLEMENT_EFFECTIF' | 'INEFFECTIF';

export const TEST_RESULT_LABELS: Record<TestResult, string> = {
  EFFECTIF: 'Effectif',
  PARTIELLEMENT_EFFECTIF: 'Partiellement effectif',
  INEFFECTIF: 'Ineffectif'
};

export interface Echantillon {
  id: number;
  numero: number;
  // Given by the backend.
  reference: string;
  anomalieDetectee: boolean;
  observation: string | null;
}

export interface AuditTest {
  id: number;
  reference: string;
  ligneProgrammeId: number;
  numeroControle: string;
  objectifId: number;
  objectifNumero: string;
  objectifDescription: string;
  missionNumero: string;
  missionIntitule: string;
  missionObjet: string | null;
  structureNom: string | null;
  lieu: string | null;
  periodeObservation: string | null;
  tacheOperation: string | null;
  faiblesseAConfirmer: string | null;
  risque: string | null;
  domaineCycle: string | null;
  typeControle: string | null;
  responsable: string | null;
  frequence: string | null;
  echantillonDescription: string | null;
  techniqueEchantillonnage: string | null;
  procedureTest: string | null;
  dateTest: string | null;
  procedureRealisee: string | null;
  resumeAnomalies: string | null;
  resultatTest: string | null;
  risqueMaitrise: boolean | null;
  recommandations: string | null;
  commentairesChefMission: string | null;
  commentairesSuperviseur: string | null;
  auditeurMissionPersonneId: number | null;
  auditeurNom: string | null;
  auditeurPrenom: string | null;
  dateAudit: string | null;
  chefMissionMissionPersonneId: number | null;
  chefMissionNom: string | null;
  chefMissionPrenom: string | null;
  dateRevueChefMission: string | null;
  superviseurMissionPersonneId: number | null;
  superviseurNom: string | null;
  superviseurPrenom: string | null;
  dateRevueSuperviseur: string | null;
  echantillons: Echantillon[];
}

export interface EchantillonRequest {
  id: number | null;
  anomalieDetectee: boolean;
  observation: string | null;
}

export interface AuditTestRequest {
  ligneProgrammeId: number;
  dateTest: string | null;
  procedureRealisee: string | null;
  resumeAnomalies: string | null;
  resultatTest: string | null;
  risqueMaitrise: boolean;
  recommandations: string | null;
  commentairesChefMission: string | null;
  commentairesSuperviseur: string | null;
  auditeurMissionPersonneId: number | null;
  dateAudit: string | null;
  chefMissionMissionPersonneId: number | null;
  dateRevueChefMission: string | null;
  superviseurMissionPersonneId: number | null;
  dateRevueSuperviseur: string | null;
  echantillons: EchantillonRequest[];
}
