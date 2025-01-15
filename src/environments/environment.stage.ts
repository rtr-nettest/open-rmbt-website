export const environment = {
  baseUrl: "https://dev2.netztest.at",
  deployedUrl: "https://dev2.netztest.at",
  api: {
    baseUrl: "https://dev2.netztest.at",
    fallback_url_ipv4_check: "https://dev2v4.netztest.at/RMBTControlServer/ip",
    fallback_url_ipv6_check: "https://dev2v6.netztest.at/RMBTControlServer/ip",
    cloud: "https://dev2.netztest.at",
    fallback_url_statistic_server:
      "https://dev2.netztest.at/RMBTStatisticServer",
    fallback_url_web_statistic_server:
      "https://dev2.netztest.at/RMBTStatisticServer",
    fallback_url_map_server: "https://dev2.netztest.at/RMBTMapServer",
  },
  certifiedTests: {
    count: 5,
    interval: 1,
  },
}
