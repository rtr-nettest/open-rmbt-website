import { computed, inject, Injectable, signal } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { IUserSetingsResponse } from "../../test/interfaces/user-settings-response.interface"
import gitInfo from "../../../../git-info.json"
import { AnnouncerMessage } from "../components/announcer/announcer.component"
import { OptionsStoreService } from "../../options/store/options-store.service"

export type GitInfo = {
  branch: string
  hash: string
  version: string
  rmbtwsBranch: string
  rmbtwsHash: string
  rmbtwsVersion: string
}

@Injectable({
  providedIn: "root",
})
export class MainStore {
  private optionsStore = inject(OptionsStoreService)
  routingEvent = signal<"popstate" | "pushstate" | null>(null)
  inProgress$ = new BehaviorSubject<boolean>(false)
  error$ = new BehaviorSubject<Error | null>(null)
  settings = signal<IUserSetingsResponse | null>(null)
  api = computed(() => {
    const {
      control_ipv4_only,
      control_ipv6_only,
      url_ipv4_check,
      url_ipv6_check,
      url_statistic_server,
      url_web_statistic_server,
      url_web_recent_server,
      url_web_osm_tiles,
      url_web_basemap_tiles,
    } = this.settings()?.settings?.[0]?.urls || {}
    const url_map_server = this.getMapServerUrl()
    const cloud = url_map_server ? new URL(url_map_server).origin : undefined
    const missingEndpoints = [
      ["control_ipv4_only", control_ipv4_only],
      ["control_ipv6_only", control_ipv6_only],
      ["url_ipv4_check", url_ipv4_check],
      ["url_ipv6_check", url_ipv6_check],
      ["url_statistic_server", url_statistic_server],
      ["url_map_server", url_map_server],
      ["url_web_statistic_server", url_web_statistic_server],
      ["url_web_recent_server", url_web_recent_server],
      ["url_web_osm_tiles", url_web_osm_tiles],
      ["url_web_basemap_tiles", url_web_basemap_tiles],
    ]
      .filter(([_, url]) => !url)
      .map(([name]) => name)
    if (missingEndpoints.length)
      console.log("Missing endpoints:", missingEndpoints.join(", "))
    return {
      cloud,
      control_ipv4_only,
      control_ipv6_only,
      url_ipv4_check,
      url_ipv6_check,
      url_statistic_server,
      url_map_server,
      url_web_statistic_server,
      url_web_recent_server,
      url_web_osm_tiles,
      url_web_basemap_tiles,
    }
  })
  servers = computed(() => this.settings()?.settings?.[0]?.servers_ws || [])
  announcerMessage = signal<AnnouncerMessage | null>(null)

  get gitInfo() {
    return gitInfo as GitInfo
  }

  // Returns the map server URL from settings, with the hostname replaced by the
  // user's override host when the map-server override is enabled on the Options
  // page. Scheme, port and path (e.g. "/RMBTMapServer") are preserved so all
  // "/tiles" endpoints keep working.
  private getMapServerUrl(): string | undefined {
    const url_map_server = this.settings()?.settings?.[0]?.urls?.url_map_server
    if (!url_map_server) {
      return url_map_server
    }
    const host = this.optionsStore.mapServerHost().trim()
    if (!this.optionsStore.overrideMapServer() || !host) {
      return url_map_server
    }
    try {
      const url = new URL(url_map_server)
      url.hostname = host
      return url.toString().replace(/\/$/, "")
    } catch {
      return url_map_server
    }
  }
}
