export const environment = {
  baseUrl: "https://dev2.netztest.at",
  deployedUrl: "https://dev2.netztest.at",
  api: {
    baseUrl: "https://dev2.netztest.at",
  },
  loopModeDefaults: {
    default_delay: 30,
    default_tests: 10,
    max_delay: 2000,
    max_tests: 30,
    min_delay: 3,
    min_tests: 3,
    exclude_from_result: ["networkType"],
  },
  certifiedDefaults: {
    default_delay: 2,
    default_tests: 8,
    max_speed_firefox_mbps: 333,
    exclude_from_result: ["networkType"],
    disable_graphics: false,
  },
}
