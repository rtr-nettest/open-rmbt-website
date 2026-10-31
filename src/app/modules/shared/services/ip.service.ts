import { inject, Injectable, signal } from "@angular/core"
import { IpResponse } from "../interfaces/ip-response.interface"
import { MainStore } from "../store/main.store"
import { OptionsStoreService } from "../../options/store/options-store.service"
import { ConnectivityService } from "../../test/services/connectivity.service"
import { interval, Subscription } from "rxjs"
import { environment } from "../../../../environments/environment"
import { NOT_AVAILABLE } from "../constants/strings"
import { TestStore } from "../../test/store/test.store"
import { I18nStore } from "../../i18n/store/i18n.store"

@Injectable({
  providedIn: "root",
})
export class IpService {
  ipV4 = signal<string | null>(null)
  ipV6 = signal<string | null>(null)
  ipV4IsProxy = signal<boolean>(false)
  ipV6IsProxy = signal<boolean>(false)
  ipV4Loading = signal<boolean>(false)
  ipV6Loading = signal<boolean>(false)
  private readonly mainStore: MainStore = inject(MainStore)
  private readonly optionsStore: OptionsStoreService =
    inject(OptionsStoreService)
  private readonly testStore: TestStore = inject(TestStore)
  private readonly i18nStore: I18nStore = inject(I18nStore)
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

  // Query the primary IP-check server plus any url_alternative_ipv4_check
  // servers in parallel, keeping only the servers that responded. The primary
  // URL is kept first so its response wins when picking the proxy flag.
  async getIpV4All(): Promise<IpResponse[]> {
    const api = this.mainStore.api()
    return this.getAllIps([
      api.url_ipv4_check,
      ...(api.url_alternative_ipv4_check ?? []),
    ])
  }

  async getIpV6All(): Promise<IpResponse[]> {
    const api = this.mainStore.api()
    return this.getAllIps([
      api.url_ipv6_check,
      ...(api.url_alternative_ipv6_check ?? []),
    ])
  }

  private async getAllIps(urls: (string | undefined)[]): Promise<IpResponse[]> {
    const responses = await Promise.all(urls.map((url) => this.getIp(url)))
    return responses.filter((r): r is IpResponse => r !== null)
  }

  // Build the string shown on the start page from the servers that responded:
  // a single IP when they agree, or "<varying>: <ip> <ip> …" (distinct IPs,
  // sorted for a stable order) when they differ.
  private resolveIpDisplay(responses: IpResponse[]): {
    display: string
    isProxy: boolean
  } {
    if (!responses.length) {
      return { display: NOT_AVAILABLE, isProxy: false }
    }
    const distinctIps = [...new Set(responses.map((r) => r.ip))].sort()
    if (distinctIps.length === 1) {
      return { display: distinctIps[0], isProxy: responses[0].is_proxy === true }
    }
    const label = this.i18nStore.translate("varying")
    return { display: `${label}: ${distinctIps.join(" ")}`, isProxy: false }
  }

  private setIPv4 = (responses: IpResponse[]) => {
    const { display, isProxy } = this.resolveIpDisplay(responses)
    this.ipV4.set(display)
    this.ipV4IsProxy.set(isProxy)
    this.ipV4Loading.set(false)
    if (!responses.length) {
      this.optionsStore.disableIpVersion("ipv4")
    }
  }

  private setIPv6 = (responses: IpResponse[]) => {
    const { display, isProxy } = this.resolveIpDisplay(responses)
    this.ipV6.set(display)
    this.ipV6IsProxy.set(isProxy)
    this.ipV6Loading.set(false)
    if (!responses.length) {
      this.optionsStore.disableIpVersion("ipv6")
    }
  }

  private loadIpInfo() {
    if (!this.connectivity.isOnline()) {
      return
    }
    if (this.ipV4() === NOT_AVAILABLE || this.ipV4() === null) {
      this.getIpV4All().then(this.setIPv4)
    }
    if (this.ipV6() === NOT_AVAILABLE || this.ipV6() === null) {
      this.getIpV6All().then(this.setIPv6)
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
        this.setIPv4([])
        this.setIPv6([])
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
            this.testStore.basicNetworkInfo().testUuid
              ? { test_uuid: this.testStore.basicNetworkInfo().testUuid }
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
