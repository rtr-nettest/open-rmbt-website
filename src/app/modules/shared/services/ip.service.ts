import { Injectable } from "@angular/core"
import { IpResponse } from "../interfaces/ip-response.interface"
import { I18nStore } from "../../i18n/store/i18n.store"
import { MainStore } from "../store/main.store"

@Injectable({
  providedIn: "root",
})
export class IpService {
  constructor(
    private readonly i18nStore: I18nStore,
    private readonly mainStore: MainStore
  ) {}

  async getIpV4() {
    return this.getIp(this.mainStore.api().url_ipv4_check)
  }

  async getIpV6() {
    return this.getIp(this.mainStore.api().url_ipv6_check)
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
        })
      ).json()
    } catch (_) {
      return null
    }
  }
}
