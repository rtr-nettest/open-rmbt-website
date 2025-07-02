export const environment = {
  baseUrl: "https://dev2.netztest.at",
  deployedUrl: "https://dev2.netztest.at",
  api: {
    baseUrl: "https://dev2.netztest.at",
  },
  loopModeDefaults: {
    default_delay: 15,
    default_tests: 8,
    max_delay: 1440,
    max_tests: 500,
    min_delay: 5,
    min_tests: 1,
    exclude_from_result: ["networkType"],
  },
  certifiedDefaults: {
    default_delay: 15,
    default_tests: 8,
    max_speed_firefox_mbps: 400,
    exclude_from_result: ["networkType"],
    disable_graphics: true,
  },
}
