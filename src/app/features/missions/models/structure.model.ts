export interface Structure {
  id: number;
  nom: string;
  descriptions: string | null;
}

export type StructureRequest = Omit<Structure, 'id'>;
