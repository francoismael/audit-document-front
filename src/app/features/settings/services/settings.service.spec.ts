import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';

import { API_BASE_URL } from '../../../core/http/api.config';
import { SettingsService } from './settings.service';

describe('SettingsService', () => {
  it('should read the settings of the application', () => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()]
    });
    const httpTesting = TestBed.inject(HttpTestingController);

    TestBed.inject(SettingsService).getSettings().subscribe();

    expect(httpTesting.expectOne(`${API_BASE_URL}/parametres`).request.method).toBe('GET');
    httpTesting.verify();
  });
});
