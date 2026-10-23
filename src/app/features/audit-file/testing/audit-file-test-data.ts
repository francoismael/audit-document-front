import { Mission } from '../../missions/models/mission.model';

// Mission shared by the tests of the workspace: a full team, with one point focal.
export const TEST_MISSION: Mission = {
  id: 10,
  numero: '005',
  intitule: 'Audit de la gestion financière',
  objet: 'Contrôle des procédures comptables.',
  dateDebut: '2026-11-02',
  dateFin: '2026-11-27',
  dateSignature: '2026-10-30',
  structureId: 3,
  structureNom: 'Direction des Ressources Humaines',
  personnes: [
    { missionPersonneId: 1, personneId: 1, nom: 'Rakoto', prenom: 'Jean', fonction: 'Directeur', services: 'DAI', roles: 'DIRECTEUR_AUDIT_INTERNE' },
    { missionPersonneId: 2, personneId: 2, nom: 'Rabe', prenom: 'Aina', fonction: 'Chef de service', services: 'DAI', roles: 'CHEF_MISSION' },
    { missionPersonneId: 3, personneId: 3, nom: 'Rasoa', prenom: 'Lova', fonction: 'Inspecteur', services: 'DAI', roles: 'SUPERVISEUR' },
    { missionPersonneId: 4, personneId: 4, nom: 'Randria', prenom: 'Hery', fonction: 'Auditeur', services: 'DAI', roles: 'AUDITEUR' },
    { missionPersonneId: 5, personneId: 4, nom: 'Randria', prenom: 'Hery', fonction: 'Auditeur', services: 'DAI', roles: 'CHEF_MISSION' },
    { missionPersonneId: 6, personneId: 5, nom: 'Ravelo', prenom: 'Tiana', fonction: 'Directeur des RH', services: 'DRH', roles: 'POINT_FOCAL' }
  ]
};
