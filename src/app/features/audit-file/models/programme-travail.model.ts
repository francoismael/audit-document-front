// Text fields of a line of the work programme, in the order of the columns of Document.docx.
export interface LigneProgrammeFields {
  tacheOperation: string | null;
  faiblesseAConfirmer: string | null;
  responsable: string | null;
  frequence: string | null;
  typeControle: string | null;
  domaineCycle: string | null;
  risque: string | null;
  procedureTest: string | null;
  echantillonDescription: string | null;
  techniqueAudit: string | null;
  techniqueEchantillonnage: string | null;
}

export interface LigneProgramme extends LigneProgrammeFields {
  id: number;
  // Given by the backend for each control of the programme.
  numeroControle: string;
  objectifId: number;
  objectifNumero: string;
  objectifDescription: string;
}

export interface ProgrammeTravail {
  id: number;
  missionId: number;
  missionNumero: string;
  missionIntitule: string;
  missionObjet: string | null;
  structureId: number | null;
  structureNom: string | null;
  lignes: LigneProgramme[];
}

export interface LigneProgrammeRequest extends LigneProgrammeFields {
  // Null for a new line; an existing one keeps its id and its control number.
  id: number | null;
  objectifId: number;
}

export interface ProgrammeTravailRequest {
  missionId: number;
  lignes: LigneProgrammeRequest[];
}
