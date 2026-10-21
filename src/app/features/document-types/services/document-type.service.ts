import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { DocumentTemplate, TemplateValidation } from '../models/document-template.model';
import { DocumentType, DocumentTypeForm, DocumentTypeRequest } from '../models/document-type.model';

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

  create(request: DocumentTypeRequest): Observable<DocumentType> {
    return this.http.post<DocumentType>(this.baseUrl, request);
  }

  update(documentTypeId: number, request: DocumentTypeRequest): Observable<DocumentType> {
    return this.http.put<DocumentType>(`${this.baseUrl}/${documentTypeId}`, request);
  }

  changeStatus(documentTypeId: number, actif: boolean): Observable<DocumentType> {
    return this.http.patch<DocumentType>(`${this.baseUrl}/${documentTypeId}/statut`, { actif });
  }

  delete(documentTypeId: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${documentTypeId}`);
  }

  uploadTemplate(documentTypeId: number, file: File): Observable<DocumentTemplate> {
    const body = new FormData();
    body.append('file', file);

    return this.http.post<DocumentTemplate>(`${this.baseUrl}/${documentTypeId}/template`, body);
  }

  validateTemplate(documentTypeId: number): Observable<TemplateValidation> {
    return this.http.get<TemplateValidation>(`${this.baseUrl}/${documentTypeId}/template/validate-variables`);
  }
}
