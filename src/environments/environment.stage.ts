export const environment = {
  baseUrl: "https://dev2.netztest.at",
  deployedUrl: "https://dev2.netztest.at",
  api: {
    baseUrl: "https://dev2.netztest.at",
  },
  loopModeDefaults: {
    default_delay: 15,
    default_tests: 8,
    max_delay: 1000,
    max_tests: 555,
    min_delay: 5,
    min_tests: 9,
    exclude_from_result: ["networkType"],
  },
  certifiedDefaults: {
    default_delay: 2,
    default_tests: 6,
    max_speed_firefox_mbps: 300,
    exclude_from_result: ["networkType"],
    disable_graphics: true,
  },
}
