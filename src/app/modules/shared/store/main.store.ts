import { computed, Injectable, signal } from "@angular/core"
import { BehaviorSubject } from "rxjs"
import { IUserSetingsResponse } from "../../test/interfaces/user-settings-response.interface"

@Injectable({
  providedIn: "root",
})
export class MainStore {
  inProgress$ = new BehaviorSubject<boolean>(false)
  error$ = new BehaviorSubject<Error | null>(null)
  referrer$ = new BehaviorSubject<string | null>(null)
  settings = signal<IUserSetingsResponse | null>(null)
  api = computed(() => {
    const {
      url_ipv4_check,
      url_ipv6_check,
      url_statistic_server,
      url_map_server,
      url_web_statistic_server,
      url_web_recent_server,
      url_web_osm_tiles,
      url_web_basemap_tiles,
    } = this.settings()?.settings?.[0]?.urls || {}
    const cloud = url_map_server ? new URL(url_map_server).origin : undefined
    const missingEndpoints = [
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
}
