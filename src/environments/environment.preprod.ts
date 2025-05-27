export const environment = {
  baseUrl: "http://localhost:4200",
  deployedUrl: "http://localhost:4200",
  api: {
    baseUrl: "https://c01.netztest.at",
  },
  loopModeDefaults: {
    max_delay: 1,
    max_tests: 3,
    min_delay: 1,
    min_tests: 1,
    exclude_from_result: ["networkType"],
  },
  certifiedDefaults: {
    max_delay: 1,
    max_tests: 3,
    max_speed_firefox_mbps: 900,
    exclude_from_result: ["networkType"],
    disable_graphics: true,
  },
}
