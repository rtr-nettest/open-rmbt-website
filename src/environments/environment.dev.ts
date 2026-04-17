import { IEnvironment } from "./environment.interface"

export const environment: IEnvironment = {
  baseUrl: "https://dev.netztest.at",
  deployedUrl: "https://dev.netztest.at",
  api: {
    baseUrl: "https://dev.netztest.at",
  },
  loopModeDefaults: {
    default_delay: 1,
    default_tests: 5,
    max_delay: 1440,
    max_tests: 500,
    min_delay: 1,
    min_tests: 1,
    exclude_from_result: ["networkType"],
  },
  certifiedDefaults: {
    default_delay: 1,
    default_tests: 5,
    max_speed_firefox_mbps: 900,
    exclude_from_result: ["networkType"],
    disable_graphics: true,
  },
  features: {
    show_server_selection: true,
    show_history_filter: true,
    show_fences_in_details: true,
    show_fences_in_history: true,
    show_fences_tile: true,
  },
  matomo: {
    trackerUrl: "https://piwik.netztest.at",
    siteId: "43",
  },
}
