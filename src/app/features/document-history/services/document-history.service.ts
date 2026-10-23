import { HttpClient, HttpParams, HttpResponse } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { readFileName, saveFile } from '../../../core/http/file-download';
import { DocumentHistoryFilters } from '../models/document-history-filters.model';
import { GeneratedDocument } from '../models/generated-document.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentHistoryService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/documents-generes`;

  getAll(filters: DocumentHistoryFilters): Observable<GeneratedDocument[]> {
    let params = new HttpParams();

    if (filters.documentTypeId !== null) {
      params = params.set('documentTypeId', filters.documentTypeId);
    }

    if (filters.missionId !== null) {
      params = params.set('missionId', filters.missionId);
    }

    return this.http.get<GeneratedDocument[]>(this.baseUrl, { params });
  }

  getById(documentId: number): Observable<GeneratedDocument> {
    return this.http.get<GeneratedDocument>(`${this.baseUrl}/${documentId}`);
  }

  // The whole response is returned so that the file name can be read in Content-Disposition.
  download(documentId: number): Observable<HttpResponse<Blob>> {
    return this.http.get(`${this.baseUrl}/${documentId}/download`, { responseType: 'blob', observe: 'response' });
  }

  // Downloads the file and saves it on the computer. Emits the name of the saved file.
  saveCopy(documentId: number): Observable<string> {
    return this.download(documentId).pipe(
      map((response) => {
        const fileName = readFileName(response);
        saveFile(response.body ?? new Blob(), fileName);
        return fileName;
      })
    );
  }

  delete(documentId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${documentId}`);
  }
}
