import { HttpErrorResponse } from '@angular/common/http';

interface ApiError {
  status: number;
  message: string;
  timestamp: string;
}

const DEFAULT_MESSAGE = 'Une erreur inattendue est survenue.';
const UNREACHABLE_MESSAGE = 'Le serveur est injoignable. Vérifiez que l\'API est démarrée.';

// Async because a failed file download carries its JSON error inside a Blob.
export async function readApiErrorMessage(error: unknown): Promise<string> {
  if (!(error instanceof HttpErrorResponse)) {
    return DEFAULT_MESSAGE;
  }

  if (error.status === 0) {
    return UNREACHABLE_MESSAGE;
  }

  const body: unknown = error.error instanceof Blob ? await parseBlob(error.error) : error.error;

  return isApiError(body) ? body.message : DEFAULT_MESSAGE;
}

async function parseBlob(blob: Blob): Promise<unknown> {
  try {
    return JSON.parse(await blob.text());
  } catch {
    return null;
  }
}

function isApiError(value: unknown): value is ApiError {
  return (
    typeof value === 'object' &&
    value !== null &&
    'message' in value &&
    typeof value.message === 'string'
  );
}
