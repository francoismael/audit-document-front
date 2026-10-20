export interface Personne {
  id: number;
  nom: string;
  prenom: string;
  matricule: string | null;
  fonction: string | null;
  services: string | null;
}

export type PersonneRequest = Omit<Personne, 'id'>;
