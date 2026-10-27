export interface InterviewQuestion {
  id: number;
  numero: number;
  question: string;
  reponse: string | null;
}

export interface Interview {
  id: number;
  missionId: number;
  missionNumero: string;
  missionIntitule: string;
  personneIntervieweeId: number;
  personneIntervieweeNom: string;
  personneIntervieweePrenom: string;
  // Given by the backend: FI-001, FI-002...
  reference: string;
  dateInterview: string | null;
  fonction: string | null;
  anciennete: string | null;
  redigeParPersonneId: number | null;
  redigeParPersonneNom: string | null;
  redigeParPersonnePrenom: string | null;
  superviseParPersonneId: number | null;
  superviseParPersonneNom: string | null;
  superviseParPersonnePrenom: string | null;
  valideParPersonneId: number | null;
  valideParPersonneNom: string | null;
  valideParPersonnePrenom: string | null;
  // Dates of the visas ('yyyy-MM-dd').
  dateRedaction: string | null;
  dateSupervision: string | null;
  dateValidation: string | null;
  questions: InterviewQuestion[];
}

export interface InterviewQuestionRequest {
  question: string;
  reponse: string | null;
}

export interface InterviewRequest {
  missionId: number;
  personneIntervieweeId: number;
  dateInterview: string | null;
  fonction: string | null;
  anciennete: string | null;
  redigeParPersonneId: number | null;
  superviseParPersonneId: number | null;
  valideParPersonneId: number | null;
  dateRedaction: string | null;
  dateSupervision: string | null;
  dateValidation: string | null;
  questions: InterviewQuestionRequest[];
}
