export interface DeclarationIndependance {
  id: number;
  missionId: number;
  missionNumero: string;
  missionIntitule: string;
  personneId: number;
  nom: string;
  prenom: string;
  matricule: string | null;
  fonction: string | null;
  service: string | null;
  dateDeclaration: string;
}

export interface DeclarationIndependanceRequest {
  missionId: number;
  personneId: number;
  dateDeclaration: string;
}
