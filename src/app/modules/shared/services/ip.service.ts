import { effect, Injectable, OnDestroy, signal } from "@angular/core"
import { IpResponse } from "../interfaces/ip-response.interface"
import { I18nStore } from "../../i18n/store/i18n.store"
import { MainStore } from "../store/main.store"
import { OptionsStoreService } from "../../options/store/options-store.service"
import { ConnectivityService } from "../../test/services/connectivity.service"
import { interval, Subscription } from "rxjs"
import { environment } from "../../../../environments/environment"
import { NOT_AVAILABLE } from "../constants/strings"

@Injectable({
  providedIn: "root",
})
export class IpService {
  ipV4 = signal<string | null>(null)
  ipV6 = signal<string | null>(null)
  ipV4Loading = signal<boolean>(true)
  ipV6Loading = signal<boolean>(true)
  private timerSub: Subscription | null = null

  constructor(
    private readonly i18nStore: I18nStore,
    private readonly mainStore: MainStore,
    private readonly optionsStore: OptionsStoreService,
    private readonly connectivity: ConnectivityService,
  ) {
    effect(() => {
      if (this.connectivity.isOnline()) {
        this.ipV4Loading.set(true)
        this.ipV6Loading.set(true)
        this.loadIpInfo()
      } else {
        this.handleIPv4(null)
        this.handleIPv6(null)
      }
    })
  }

  async getIpV4() {
    return this.getIp(this.mainStore.api().url_ipv4_check)
  }

  async getIpV6() {
    return this.getIp(this.mainStore.api().url_ipv6_check)
  }

  private handleIPv4 = (r: IpResponse | null) => {
    this.ipV4.set(r ? r.ip : NOT_AVAILABLE)
    this.ipV4Loading.set(false)
    if (!r) {
      this.optionsStore.disableIpVersion("ipv4")
    }
  }

  private handleIPv6 = (r: IpResponse | null) => {
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
      this.getIpV4().then(this.handleIPv4)
    }
    if (this.ipV6() === NOT_AVAILABLE || this.ipV6() === null) {
      this.getIpV6().then(this.handleIPv6)
    }
  }

  watchIpChanges(watch: boolean = true) {
    if (this.timerSub) {
      this.timerSub.unsubscribe()
    }
    if (!environment.features.ip_check_interval_ms || !watch) {
      return
    }
    this.timerSub = interval(
      environment.features.ip_check_interval_ms,
    ).subscribe(() => {
      this.loadIpInfo()
    })
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
            language: this.i18nStore.activeLang,
          }),
          signal: AbortSignal.timeout(1000),
        })
      ).json()
    } catch (_) {
      return null
    }
  }
}
