import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { Structure, StructureRequest } from '../models/structure.model';

@Injectable({
  providedIn: 'root'
})
export class StructureService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/structures`;

  getAll(): Observable<Structure[]> {
    return this.http.get<Structure[]>(this.baseUrl);
  }

  create(request: StructureRequest): Observable<Structure> {
    return this.http.post<Structure>(this.baseUrl, request);
  }
}
