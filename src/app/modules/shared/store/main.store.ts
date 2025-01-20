import { computed, Injectable, signal } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { IUserSetingsResponse } from "../../test/interfaces/user-settings-response.interface"
import { environment } from "../../../../environments/environment"

@Injectable({
  providedIn: "root",
})
export class MainStore {
  inProgress$ = new BehaviorSubject<boolean>(false)
  error$ = new BehaviorSubject<Error | null>(null)
  referrer$ = new BehaviorSubject<string | null>(null)
  settings = signal<IUserSetingsResponse | null>(null)
  api = computed(() => {
    const urls = this.settings()?.settings?.[0]?.urls
    const url_ipv4_check =
      urls?.url_ipv4_check || environment.api.fallback_url_ipv4_check
    const url_ipv6_check =
      urls?.url_ipv6_check || environment.api.fallback_url_ipv6_check
    const url_statistic_server =
      urls?.url_statistic_server ||
      environment.api.fallback_url_statistic_server
    const url_web_statistic_server =
      urls?.url_web_statistic_server ||
      environment.api.fallback_url_web_statistic_server
    const url_map_server =
      urls?.url_map_server || environment.api.fallback_url_map_server
    const cloud = url_map_server
      ? new URL(url_map_server).origin
      : environment.api.cloud
    const url_web_recent_server =
      urls?.url_web_recent_server ||
      environment.api.fallback_url_web_recent_server
    return {
      cloud,
      url_ipv4_check,
      url_ipv6_check,
      url_statistic_server,
      url_map_server,
      url_web_statistic_server,
      url_web_recent_server,
    }
  })
}
