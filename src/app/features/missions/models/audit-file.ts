import { MissionProgress } from '../../statistics/models/statistics.model';

// Flags of GET /statistiques/avancement that tell whether a document is filled in.
type ProgressFlag = 'tdr' | 'programme' | 'tests' | 'constats' | 'pvAffirmation' | 'rapport' | 'pvCloture';

export interface AuditFileDocument {
  label: string;
  // Roadmap step that builds the screen of this document; null for the mission order (the mission itself).
  step: number | null;
  progressFlag: ProgressFlag | null;
  // Page of the document in the mission workspace (/missions/:id/dossier/<slug>); null while it is not built.
  slug: string | null;
}

// The 12 documents of Document.docx, in the order of an audit.
export const AUDIT_FILE_DOCUMENTS: AuditFileDocument[] = [
  { label: 'Ordre de mission', step: null, progressFlag: null, slug: 'ordre-de-mission' },
  { label: 'Termes de référence (TDR)', step: 12, progressFlag: 'tdr', slug: 'tdr' },
  { label: "Déclarations d'indépendance", step: 13, progressFlag: null, slug: 'declarations' },
  { label: "PV de réunion d'ouverture", step: 14, progressFlag: null, slug: 'pv-ouverture' },
  { label: "Fiches d'interview", step: 15, progressFlag: null, slug: 'interviews' },
  { label: 'Programme de travail', step: 16, progressFlag: 'programme', slug: 'programme' },
  { label: 'Fiches de test', step: 17, progressFlag: 'tests', slug: 'tests' },
  { label: 'Fiches de constats', step: 18, progressFlag: 'constats', slug: 'constats' },
  { label: "PV d'affirmation des constats", step: 19, progressFlag: 'pvAffirmation', slug: 'pv-affirmation' },
  { label: "Rapport d'audit", step: 20, progressFlag: 'rapport', slug: null },
  { label: 'PV de réunion de clôture', step: 21, progressFlag: 'pvCloture', slug: null },
  { label: 'Tableau des recommandations', step: 22, progressFlag: null, slug: null }
];

export type AuditFileStatus = 'done' | 'todo' | 'unknown';

export function getAuditFileStatus(document: AuditFileDocument, progress: MissionProgress | null): AuditFileStatus {
  if (document.step === null) {
    return 'done';
  }

  if (!document.progressFlag || !progress) {
    return 'unknown';
  }

  return progress[document.progressFlag] ? 'done' : 'todo';
}
