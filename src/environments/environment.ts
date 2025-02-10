export const environment = {
  baseUrl: "http://localhost:4200",
  deployedUrl: "http://localhost:4200",
  api: {
    baseUrl: "https://dev2.netztest.at",
  },
  loopModeDefaults: {
    max_delay: 1,
    max_tests: 3,
    min_delay: 1,
    min_tests: 2,
    exclude_from_result: ["networkType"],
  },
}
