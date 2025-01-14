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
  ipv4 = computed(
    () =>
      this.settings()?.settings?.[0]?.urls?.control_ipv4_only ||
      environment.api.ipv4
  )
  ipv6 = computed(
    () =>
      this.settings()?.settings?.[0]?.urls?.control_ipv6_only ||
      environment.api.ipv6
  )
  cloud = computed(
    () =>
      this.settings()?.settings?.[0]?.urls?.url_statistic_server ||
      environment.api.cloud
  )
}
