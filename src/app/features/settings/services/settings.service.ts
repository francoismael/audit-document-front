import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

import { API_BASE_URL } from '../../../core/http/api.config';
import { AppSettings } from '../models/app-settings.model';

@Injectable({
  providedIn: 'root'
})
export class SettingsService {
  private readonly http = inject(HttpClient);

  // Read only: the backend has no setting to change.
  getSettings(): Observable<AppSettings> {
    return this.http.get<AppSettings>(`${API_BASE_URL}/parametres`);
  }
}
