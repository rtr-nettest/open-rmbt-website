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
  // Optional override of the map server host. When enabled with a valid host,
  // MainStore.api() rewrites the hostname of url_map_server accordingly.
  overrideMapServer = signal<boolean>(false)
  mapServerHost = signal<string>("")

  constructor() {
    if (globalThis.localStorage) {
      const { ipVersion, preferredServer, overrideMapServer, mapServerHost } =
        this.getOptions() || {}
      this.ipVersion.set((ipVersion as IpVersion) || "default")
      this.preferredServer.set(preferredServer || "default")
      this.overrideMapServer.set(overrideMapServer === true)
      this.mapServerHost.set(mapServerHost || "")

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
        overrideMapServer: this.overrideMapServer(),
        mapServerHost: this.mapServerHost(),
      })
    )
  }
}
