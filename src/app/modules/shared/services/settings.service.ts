import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { IUserSetingsResponse } from "../../test/interfaces/user-settings-response.interface"
import { environment } from "../../../../environments/environment"

@Injectable({
  providedIn: "root",
})
export class SettingsService {
  constructor(private readonly http: HttpClient) {}

  getSettings() {
    return this.http.post<IUserSetingsResponse>(
      `${environment.api.baseUrl}/RMBTControlServer/settings`,
      {
        language: "en",
        name: "RTR-Netztest",
        terms_and_conditions_accepted: false,
        type: "DESKTOP",
        version_code: "1",
        version_name: "0.1",
      }
    )
  }
}
