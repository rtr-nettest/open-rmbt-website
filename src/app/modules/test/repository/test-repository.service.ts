import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { IUserSetingsResponse } from "../interfaces/user-settings-response.interface"
import { environment } from "../../../../environments/environment"
import { tap } from "rxjs"
import { TC_VERSION_ACCEPTED, UUID } from "../constants/strings"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
dayjs.extend(utc)
dayjs.extend(tz)

@Injectable({
  providedIn: "root",
})
export class TestRepositoryService {
  constructor(private readonly http: HttpClient) {}

  getSettings() {
    let uuid = localStorage.getItem(UUID) ?? undefined
    return this.http
      .post<IUserSetingsResponse>(
        `${environment.api.baseUrl}/RMBTControlServer/settings`,
        {
          language: "en",
          name: "RTR-Netztest",
          terms_and_conditions_accepted: "true",
          terms_and_conditions_accepted_version: parseInt(
            localStorage.getItem(TC_VERSION_ACCEPTED) ?? "0"
          ),
          type: "DESKTOP",
          uuid,
          version_code: "1",
          version_name: "0.1",
        }
      )
      .pipe(
        tap((settings) => {
          uuid = settings?.settings[0]?.uuid
          if (uuid) {
            localStorage.setItem(UUID, uuid)
          }
        })
      )
  }
}
