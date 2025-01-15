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
    const ipv4 = urls?.control_ipv4_only || environment.api.ipv4
    const ipv6 = urls?.control_ipv6_only || environment.api.ipv6
    const statistics = urls?.url_statistic_server || environment.api.statistics
    const map = urls?.url_map_server || environment.api.map
    const cloud = map ? new URL(map).origin : environment.api.cloud
    return {
      cloud,
      ipv4,
      ipv6,
      map,
      statistics,
    }
  })
}
