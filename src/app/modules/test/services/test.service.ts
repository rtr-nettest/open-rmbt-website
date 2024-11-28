import { HttpClient } from "@angular/common/http"
import { Injectable, isDevMode } from "@angular/core"
import { IUserSetingsResponse } from "../interfaces/user-settings-response.interface"
import { environment } from "../../../../environments/environment"
import { Observable, of } from "rxjs"

@Injectable({
  providedIn: "root",
})
export class TestService {
  constructor(private readonly http: HttpClient) {}

  getSettings(): Observable<IUserSetingsResponse> {
    if (environment.baseUrl.includes("localhost")) {
      return of({
        error: [],
        settings: [{ terms_and_conditions: { version: 5 } }],
      })
    }
    return this.http.post<IUserSetingsResponse>(
      `${environment.api.baseUrl}/RMBTControlServer/settings`,
      { type: "DESKTOP", name: "RTR-Netztest" }
    )
  }
}
