export const environment = {
  baseUrl: ".",
  deployedUrl: "https://www.netztest.at",
  api: {
    baseUrl: "https://c01.netztest.at",
  },
  loopModeDefaults: {
    max_delay: 15,
    max_tests: 8,
    min_delay: 1,
    min_tests: 2,
    exclude_from_result: ["networkType"],
  },
}
