import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { DocumentField, DocumentFieldRequest } from '../models/document-field.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentFieldService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/document-fields`;

  create(request: DocumentFieldRequest): Observable<DocumentField> {
    return this.http.post<DocumentField>(this.baseUrl, request);
  }

  update(fieldId: number, request: DocumentFieldRequest): Observable<DocumentField> {
    return this.http.put<DocumentField>(`${this.baseUrl}/${fieldId}`, request);
  }

  delete(fieldId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${fieldId}`);
  }
}
