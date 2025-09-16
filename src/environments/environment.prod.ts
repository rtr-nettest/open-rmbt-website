export const environment = {
  baseUrl: ".",
  deployedUrl: "https://www.netztest.at",
  api: {
    baseUrl: "https://c01.netztest.at",
  },
  loopModeDefaults: {
    default_delay: 15,
    default_tests: 50,
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
  features: {
    show_server_selection: true,
  },
}
