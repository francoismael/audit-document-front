// One retained recommendation of a constat, with the last response of the audited entity.
export interface RecommandationLigne {
  constatId: number;
  constatReference: string;
  anomalie: string;
  recommandationId: number;
  recommandation: string;
  reponseId: number | null;
  reponse: string | null;
  dateReponse: string | null;
  // Decided once the entity has answered; null until then.
  recommandationMaintenue: boolean | null;
}

export interface TableauRecommandations {
  missionId: number;
  missionIntitule: string;
  structureId: number | null;
  structureNom: string | null;
  lignes: RecommandationLigne[];
}

export interface Reponse {
  id: number;
  recommandationId: number;
  recommandationDescription: string;
  descriptions: string;
  dateReponse: string | null;
}

export interface ReponseRequest {
  recommandationId: number;
  descriptions: string;
  dateReponse: string | null;
}
