import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { MissionProgress, Statistics } from '../models/statistics.model';

@Injectable({
  providedIn: 'root'
})
export class StatisticsService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${API_BASE_URL}/statistiques`;

  getStatistics(): Observable<Statistics> {
    return this.http.get<Statistics>(this.baseUrl);
  }

  // One entry per mission: which business documents are already filled in.
  getMissionProgress(): Observable<MissionProgress[]> {
    return this.http.get<MissionProgress[]>(`${this.baseUrl}/avancement`);
  }
}
