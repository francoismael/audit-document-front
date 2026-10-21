import { HttpResponse } from '@angular/common/http';

const DEFAULT_FILE_NAME = 'document.docx';

export function readFileName(response: HttpResponse<Blob>): string {
  const header = response.headers.get('Content-Disposition') ?? '';

  const encodedName = /filename\*=UTF-8''([^;]+)/i.exec(header);

  if (encodedName) {
    return decodeURIComponent(encodedName[1]);
  }

  const plainName = /filename="?([^";]+)"?/i.exec(header);

  return plainName ? plainName[1] : DEFAULT_FILE_NAME;
}

export function saveFile(content: Blob, fileName: string): void {
  const url = URL.createObjectURL(content);
  const link = document.createElement('a');

  link.href = url;
  link.download = fileName;
  link.click();

  // Revoking on the next tick lets the browser start the download first.
  setTimeout(() => URL.revokeObjectURL(url));
}

const OPENED_FILE_LIFETIME_MS = 60_000;

// Opens a file (a PDF for instance) in a new browser tab.
export function openFile(content: Blob): void {
  const url = URL.createObjectURL(content);

  window.open(url, '_blank', 'noopener');

  // The new tab needs the URL while it loads the file.
  setTimeout(() => URL.revokeObjectURL(url), OPENED_FILE_LIFETIME_MS);
}
