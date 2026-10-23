import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { Personne, PersonneRequest } from '../models/personne.model';

@Injectable({
  providedIn: 'root'
})
export class PersonneService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/personnes`;

  getAll(): Observable<Personne[]> {
    return this.http.get<Personne[]>(this.baseUrl);
  }

  create(request: PersonneRequest): Observable<Personne> {
    return this.http.post<Personne>(this.baseUrl, request);
  }
}
