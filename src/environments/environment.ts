export const environment = {
  baseUrl: "http://localhost:4200",
  deployedUrl: "http://localhost:4200",
  api: {
    baseUrl: "https://c01.netztest.at",
    fallback_url_ipv4_check: "https://c01v4.netztest.at/RMBTControlServer/ip",
    fallback_url_ipv6_check: "https://c01v6.netztest.at/RMBTControlServer/ip",
    cloud: "https://m-cloud.netztest.at",
    fallback_url_statistic_server:
      "https://m-cloud.netztest.at/RMBTStatisticServer",
    fallback_url_web_statistic_server:
      "https://m-cloud.netztest.at/RMBTStatisticServer",
    fallback_url_map_server: "https://m-cloud.netztest.at/RMBTMapServer",
    fallback_url_web_recent_server: "https://m-cloud.netztest.at/cache/recent",
  },
  certifiedTests: {
    count: 5,
    interval: 1,
  },
}
