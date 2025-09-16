import { effect, Injectable, signal } from "@angular/core"
import { RMBTOptions } from "../constants/strings"

export type IpVersion = "ipv4" | "ipv6" | "default"

@Injectable({
  providedIn: "root",
})
export class OptionsStoreService {
  ipVersion = signal<IpVersion>("default")
  disabledIpVersions = signal<IpVersion[]>([])
  preferredServer = signal<string>("default")

  constructor() {
    if (globalThis.localStorage) {
      const { ipVersion, preferredServer } = this.getOptions() || {}
      this.ipVersion.set((ipVersion as IpVersion) || "default")
      this.preferredServer.set(preferredServer || "default")

      effect(() => {
        this.setOptions()
      })
    }
  }

  disableIpVersion(ipVersion: IpVersion): void {
    this.disabledIpVersions.set([...this.disabledIpVersions(), ipVersion])
    if (this.ipVersion() === ipVersion) {
      this.ipVersion.set("default")
    }
  }

  getOptions() {
    const options = localStorage.getItem(RMBTOptions)
    if (options) {
      return JSON.parse(options)
    }
  }

  setOptions() {
    localStorage.setItem(
      RMBTOptions,
      JSON.stringify({
        ipVersion: this.ipVersion(),
        preferredServer: this.preferredServer(),
      })
    )
  }
}
