import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { Mission } from '../models/mission.model';

@Injectable({
  providedIn: 'root'
})
export class MissionService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/missions`;

  getAll(): Observable<Mission[]> {
    return this.http.get<Mission[]>(this.baseUrl);
  }
}
