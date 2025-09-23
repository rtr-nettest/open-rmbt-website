export const environment = {
  baseUrl: "http://localhost:4200",
  deployedUrl: "http://localhost:4200",
  api: {
    baseUrl: "https://c01.netztest.at",
  },
  loopModeDefaults: {
    default_delay: 1,
    default_tests: 3,
    max_delay: 1440,
    max_tests: 500,
    min_delay: 1,
    min_tests: 1,
    exclude_from_result: ["networkType"],
  },
  certifiedDefaults: {
    default_delay: 1,
    default_tests: 3,
    max_speed_firefox_mbps: 900,
    exclude_from_result: ["networkType"],
    disable_graphics: true,
  },
  features: {
    show_server_selection: true,
  },
  matomo: {
    trackerUrl: "https://piwik.netztest.at",
    siteId: "1",
  },
}
