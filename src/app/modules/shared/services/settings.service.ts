import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { IUserSetingsResponse } from "../../test/interfaces/user-settings-response.interface"
import { environment } from "../../../../environments/environment"
import {
  RMBTTermsV6,
  TC_VERSION_ACCEPTED,
  UUID,
} from "../../test/constants/strings"
import { tap } from "rxjs"
import { NO_ERROR_HANDLING } from "../constants/strings"
import Cookies from "js-cookie"

@Injectable({
  providedIn: "root",
})
export class SettingsService {
  constructor(private readonly http: HttpClient) {}

  getSettings() {
    let uuid = localStorage.getItem(UUID) || Cookies.get(UUID) || undefined
    let tcVersion = localStorage.getItem(TC_VERSION_ACCEPTED) || undefined
    if (!tcVersion && Cookies.get(RMBTTermsV6)) {
      tcVersion = "6"
      localStorage.setItem(TC_VERSION_ACCEPTED, tcVersion)
    }
    return this.http
      .post<IUserSetingsResponse>(
        `${environment.api.baseUrl}/RMBTControlServer/settings`,
        {
          language: "en",
          name: "RTR-Netztest",
          terms_and_conditions_accepted: !!tcVersion,
          type: "DESKTOP",
          version_code: "1",
          version_name: "0.1",
          ...(uuid ? { uuid } : {}),
          ...(tcVersion
            ? { terms_and_conditions_version: parseInt(tcVersion) }
            : {}),
        },
        {
          headers: {
            [NO_ERROR_HANDLING]: "true",
          },
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
