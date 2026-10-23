export interface Objectif {
  id: number;
  // Given by the backend: OBJ-01, OBJ-02...
  numero: string;
  descriptions: string;
}

export interface Tdr {
  id: number;
  missionId: number;
  missionNumero: string;
  missionIntitule: string;
  missionObjet: string | null;
  structureId: number | null;
  structureNom: string | null;
  contexte: string | null;
  competence: string | null;
  perimetre: string | null;
  periodeObservation: string | null;
  lieu: string | null;
  methodologieTravail: string | null;
  resultatsAttendus: string | null;
  livrables: string | null;
  // Date written at the top of the document ('yyyy-MM-dd').
  dateTdr: string | null;
  objectifs: Objectif[];
}

export interface ObjectifRequest {
  // Null for a new objective; an existing one keeps its id and its numero.
  id: number | null;
  descriptions: string;
}

export interface TdrRequest {
  missionId: number;
  contexte: string | null;
  competence: string | null;
  perimetre: string | null;
  periodeObservation: string | null;
  lieu: string | null;
  methodologieTravail: string | null;
  resultatsAttendus: string | null;
  livrables: string | null;
  dateTdr: string | null;
  objectifs: ObjectifRequest[];
}
