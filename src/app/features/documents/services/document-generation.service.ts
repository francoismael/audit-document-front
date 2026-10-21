import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { readFileName } from '../../../core/http/file-download';
import { DynamicFormValues } from '../../../shared/interfaces/dynamic-field.interface';
import { GeneratedFile } from '../models/generated-file.model';

const DOCUMENT_ID_HEADER = 'X-Document-Id';

@Injectable({
  providedIn: 'root'
})
export class DocumentGenerationService {
  private readonly http = inject(HttpClient);

  generate(
    documentTypeId: number,
    values: DynamicFormValues,
    missionId: number | null
  ): Observable<GeneratedFile> {
    const params = missionId === null ? new HttpParams() : new HttpParams().set('missionId', missionId);

    return this.http
      .post(`${API_BASE_URL}/document-types/${documentTypeId}/generate`, values, {
        params,
        observe: 'response',
        responseType: 'blob'
      })
      .pipe(
        map((response) => {
          const documentId = response.headers.get(DOCUMENT_ID_HEADER);

          return {
            fileName: readFileName(response),
            documentId: documentId ? Number(documentId) : null,
            content: response.body ?? new Blob()
          };
        })
      );
  }
}
