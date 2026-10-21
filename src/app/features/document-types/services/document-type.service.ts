import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { DocumentType, DocumentTypeForm } from '../models/document-type.model';

@Injectable({
  providedIn: 'root'
})
export class DocumentTypeService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/document-types`;

  getAll(): Observable<DocumentType[]> {
    return this.http.get<DocumentType[]>(this.baseUrl);
  }

  getForm(documentTypeId: number): Observable<DocumentTypeForm> {
    return this.http.get<DocumentTypeForm>(`${this.baseUrl}/${documentTypeId}/form`);
  }
}
