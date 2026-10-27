export type RiskLevel = 'FAIBLE' | 'MOYEN' | 'ELEVE';

export const RISK_LEVEL_LABELS: Record<RiskLevel, string> = {
  FAIBLE: 'Faible',
  MOYEN: 'Moyen',
  ELEVE: 'Élevé'
};

export interface ConstatItem {
  id: number;
  descriptions: string;
}

export interface ConstatRisque extends ConstatItem {
  niveau: string | null;
}

export interface ConstatRecommandation {
  id: number;
  description: string;
  retenue: boolean;
  // Set later, in the table of recommendations (step 22).
  maintenue: boolean | null;
}

export interface Constat {
  id: number;
  testId: number;
  testReference: string;
  numeroControle: string;
  domaineCycle: string | null;
  objectifId: number;
  objectifNumero: string;
  objectifDescription: string;
  reference: string;
  descriptions: string;
  niveauRisque: string | null;
  directionServiceConcerne: string | null;
  causes: ConstatItem[];
  risques: ConstatRisque[];
  consequences: ConstatItem[];
  recommandations: ConstatRecommandation[];
}

// Inner items of a request: id null for a new one, the id of an existing one to keep it.
export interface ConstatItemRequest {
  id: number | null;
  descriptions: string;
}

export interface ConstatRisqueRequest extends ConstatItemRequest {
  niveau: string | null;
}

export interface ConstatRecommandationRequest {
  id: number | null;
  description: string;
  retenue: boolean;
}

export interface ConstatRequest {
  testId: number;
  descriptions: string;
  niveauRisque: string | null;
  directionServiceConcerne: string | null;
  causes: ConstatItemRequest[];
  risques: ConstatRisqueRequest[];
  consequences: ConstatItemRequest[];
  recommandations: ConstatRecommandationRequest[];
}
