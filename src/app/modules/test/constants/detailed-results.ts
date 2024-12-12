import { Translation } from "../../i18n/store/i18n.store"
import { roundToSignificantDigits } from "../../shared/util/math"

export const RESULT_DATE_FORMAT = "YYYY-MM-DD HH:mm:ss"

export const INITIAL_KEYS = new Set([
  "network_type",
  "cat_technology",
  "location",
  "distance",
  "gkz",
  "locality",
  "community",
  "district",
  "province",
  "network_name",
  "provider_name",
  "network_mcc_mnc",
  "network_country",
  "roaming_type",
  "sim_mcc_mnc",
  "sim_country",
  "lte_rsrq",
  "connection",
  "country_geoip",
  "public_ip_as_name",
  "platform",
  "model",
])

export const SKIPPED_KEYS = new Set([
  "speed_curve",
  "download_classification",
  "upload_classification",
  "ping_classification",
  "long",
  "lat",
  "loc_accuracy",
  "loc_src",
  "implausible",
  "pinned",
  "product",
])

export const SEARCHED_KEYS: {
  [key: string]: null | ((testData: any) => string)
} = {
  cat_technology: null,
  radio_band: null,
  network_name: null,
  provider_name: null,
  network_country: null,
  country_sim: (testData: any) => testData["sim_country"],
  country_geoip: (testData: any) => testData.country_geoip.toLowerCase(),
  public_ip_as_name: null,
  country_asn: (testData: any) => testData.country_asn.toLowerCase(),
  platform: null,
  model: null,
  client_version: null,
  open_uuid: null,
}

export const FORMATTED_KEYS: {
  [key: string]: null | ((testData: any, translations?: Translation) => string)
} = {
  test_duration: (testData: any) => `${testData.test_duration} s`,
  bytes_download: (testData: any) =>
    `${Math.round(testData.bytes_download / 1e6)} MB`,
  bytes_upload: (testData: any) =>
    `${Math.round(testData.bytes_upload / 1e6)} MB`,
  duration_download_ms: (testData: any) =>
    `${Math.round(testData.duration_download_ms / 100) / 10} s`,
  duration_upload_ms: (testData: any) =>
    `${Math.round(testData.duration_upload_ms / 100) / 10} s`,
  download_kbit: (testData: any, t: any) =>
    `${roundToSignificantDigits(testData.download_kbit / 1e3)} ${
      t["Mbps"] || "Mbps"
    }`,
  upload_kbit: (testData: any, t: any) =>
    `${roundToSignificantDigits(testData.upload_kbit / 1e3)} ${
      t["Mbps"] || "Mbps"
    }`,
  wifi_link_speed: (testData: any, t: any) =>
    `${testData.wifi_link_speed} ${t["Mbps"] || "Mbps"}`,
  ping_ms: (testData: any, t: any) =>
    `${Math.round(testData.ping_ms)} ${t["ms"] || "ms"}`,
  ip_anonym: (testData: any) => {
    var ip = testData?.ip_anonym ?? ""
    //add ".x" to IPv4 addresses
    if (ip.indexOf("x") === -1 && ip.indexOf(".") > 0) {
      ip += ".x"
    }
    return ip
  },
  network_country: (testData: any, t: any) =>
    t[testData.network_country] || testData.network_country,
  sim_country: (testData: any, t: any) =>
    t[testData.sim_country] || testData.sim_country,
  country_geoip: (testData: any, t: any) =>
    t[testData.country_geoip] || testData.country_geoip,
  country_asn: (testData: any, t: any) =>
    t[testData.country_asn] || testData.country_asn,
  lte_rsrq: (testData: any, t: any) =>
    `${testData.lte_rsrq} ${t["dB"] || "dB"}`,
  roaming_type: (testData: any, t: any) => {
    let roaming_type = testData.roaming_type
    if (roaming_type === null) {
      return null
    }
    switch (roaming_type) {
      case 0:
        return t["roaming_none"]
      case 1:
        return t["roaming_national"]
      case 2:
        return t["roaming_international"]
    }
    return roaming_type
  },
  temperature: (testData: any) =>
    testData.temperature ? testData.temperature + " °C" : "",
}
