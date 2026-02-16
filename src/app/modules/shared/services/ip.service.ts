import { inject, Injectable, signal } from "@angular/core"
import { IpResponse } from "../interfaces/ip-response.interface"
import { MainStore } from "../store/main.store"
import { OptionsStoreService } from "../../options/store/options-store.service"
import { ConnectivityService } from "../../test/services/connectivity.service"
import { interval, Subscription } from "rxjs"
import { environment } from "../../../../environments/environment"
import { NOT_AVAILABLE } from "../constants/strings"
import { TestStore } from "../../test/store/test.store"

@Injectable({
  providedIn: "root",
})
export class IpService {
  ipV4 = signal<string | null>(null)
  ipV6 = signal<string | null>(null)
  ipV4Loading = signal<boolean>(false)
  ipV6Loading = signal<boolean>(false)
  private readonly mainStore: MainStore = inject(MainStore)
  private readonly optionsStore: OptionsStoreService =
    inject(OptionsStoreService)
  private readonly testStore: TestStore = inject(TestStore)
  private readonly connectivity: ConnectivityService =
    inject(ConnectivityService)
  private connectivitySub: Subscription | null = null
  private timerSub: Subscription | null = null

  async getIpV4() {
    return this.getIp(this.mainStore.api().url_ipv4_check)
  }

  async getIpV6() {
    return this.getIp(this.mainStore.api().url_ipv6_check)
  }

  private setIPv4 = (r: IpResponse | null) => {
    this.ipV4.set(r ? r.ip : NOT_AVAILABLE)
    this.ipV4Loading.set(false)
    if (!r) {
      this.optionsStore.disableIpVersion("ipv4")
    }
  }

  private setIPv6 = (r: IpResponse | null) => {
    this.ipV6.set(r ? r.ip : NOT_AVAILABLE)
    this.ipV6Loading.set(false)
    if (!r) {
      this.optionsStore.disableIpVersion("ipv6")
    }
  }

  private loadIpInfo() {
    if (!this.connectivity.isOnline()) {
      return
    }
    if (this.ipV4() === NOT_AVAILABLE || this.ipV4() === null) {
      this.getIpV4().then(this.setIPv4)
    }
    if (this.ipV6() === NOT_AVAILABLE || this.ipV6() === null) {
      this.getIpV6().then(this.setIPv6)
    }
  }

  watchIpChanges(watch: boolean = true) {
    this.timerSub?.unsubscribe()
    this.connectivitySub?.unsubscribe()
    if (!watch) {
      return
    }
    this.connectivitySub = this.connectivity.isOnline$.subscribe((isOnline) => {
      if (!isOnline) {
        this.setIPv4(null)
        this.setIPv6(null)
      } else {
        this.ipV4Loading.set(true)
        this.ipV6Loading.set(true)
        this.loadIpInfo()
      }
    })
    if (environment.features.ip_check_interval_ms) {
      this.timerSub = interval(
        environment.features.ip_check_interval_ms,
      ).subscribe(() => {
        this.loadIpInfo()
      })
    }
  }

  private async getIp(url?: string): Promise<IpResponse | null> {
    if (!url) {
      return null
    }
    try {
      return (
        await fetch(url, {
          method: "POST",
          body: JSON.stringify({
            ...(this.mainStore.settings()?.settings[0].uuid
              ? {
                  client_uuid: this.mainStore.settings()?.settings[0].uuid,
                }
              : {}),
            ...(this.testStore.isRunning() &&
            this.testStore.basicNetworkInfo().testToken
              ? { test_token: this.testStore.basicNetworkInfo().testToken }
              : {}),
          }),
          headers: {
            "Content-Type": "application/json",
          },
          signal: AbortSignal.timeout(1000),
        })
      ).json()
    } catch (_) {
      return null
    }
  }
}
