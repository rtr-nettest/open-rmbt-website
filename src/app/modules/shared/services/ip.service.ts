import { Injectable } from "@angular/core"
import { environment } from "../../../../environments/environment"
import { IpResponse } from "../interfaces/ip-response.interface"
import { I18nStore } from "../../i18n/store/i18n.store"

@Injectable({
  providedIn: "root",
})
export class IpService {
  constructor(private readonly i18nStore: I18nStore) {}

  async getIpV4() {
    return this.getIp(`${environment.api.ipv4}/RMBTControlServer/ip`)
  }

  async getIpV6() {
    return this.getIp(`${environment.api.ipv6}/RMBTControlServer/ip`)
  }

  private async getIp(url: string): Promise<IpResponse | null> {
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
