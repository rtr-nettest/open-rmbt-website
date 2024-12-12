import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
dayjs.extend(utc)
dayjs.extend(tz)
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
  "duration_download_ms",
  "duration_upload_ms",
  "server_name",
  "open_uuid",
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
  [key: string]: null | ((testData: any) => string | string[])
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
  time: (testData: any) => {
    const d = dayjs(testData.time, RESULT_DATE_FORMAT)
    return [
      `>${d.startOf("day").utc().format(RESULT_DATE_FORMAT)}`,
      `<${d.endOf("day").utc().format(RESULT_DATE_FORMAT)}`,
    ]
  },
}

const formatBytes = (bytes: any, t: any) => {
  if (bytes === null) return ""
  var unit = t["bytes"]
  if (bytes > 1000) {
    bytes = bytes / 1000
    unit = t["KB"]
  }
  if (bytes > 1000) {
    bytes = bytes / 1000
    unit = t["MB"]
  }
  return roundToSignificantDigits(bytes) + "&nbsp;" + unit
}

export const FORMATTED_KEYS: {
  [key: string]: null | ((testData: any, translations?: Translation) => string)
} = {
  test_duration: (testData: any) => `${testData.test_duration} s`,

  // Download
  bytes_download: (testData: any, t: any) =>
    formatBytes(testData.bytes_download, t),
  test_if_bytes_download: (testData: any, t: any) =>
    formatBytes(testData.test_if_bytes_download, t),
  testdl_if_bytes_download: (testData: any, t: any) =>
    formatBytes(testData.testdl_if_bytes_download, t),
  testdl_if_bytes_upload: (testData: any, t: any) =>
    formatBytes(testData.testdl_if_bytes_upload, t),
  ndt_download_kbit: (testData: any, t: any) =>
    `${roundToSignificantDigits(testData.ndt_download_kbit / 1e3)} ${
      t["MB"] || "MB"
    }`,
  download_kbit: (testData: any, t: any) =>
    `${roundToSignificantDigits(testData.download_kbit / 1e3)} ${
      t["Mbps"] || "Mbps"
    }`,

  // Upload
  bytes_upload: (testData: any, t: any) =>
    formatBytes(testData.bytes_upload, t),
  test_if_bytes_upload: (testData: any, t: any) =>
    formatBytes(testData.test_if_bytes_upload, t),
  testul_if_bytes_download: (testData: any, t: any) =>
    formatBytes(testData.testul_if_bytes_download, t),
  testul_if_bytes_upload: (testData: any, t: any) =>
    formatBytes(testData.testul_if_bytes_upload, t),
  ndt_upload_kbit: (testData: any, t: any) =>
    `${roundToSignificantDigits(testData.ndt_upload_kbit / 1e3)} ${
      t["MB"] || "MB"
    }`,
  upload_kbit: (testData: any, t: any) =>
    `${roundToSignificantDigits(testData.upload_kbit / 1e3)} ${
      t["Mbps"] || "Mbps"
    }`,

  wifi_link_speed: (testData: any, t: any) =>
    `${testData.wifi_link_speed} ${t["Mbps"] || "Mbps"}`,

  ping_ms: (testData: any, t: any) =>
    `${Math.round(testData.ping_ms)} ${t["millis"] || "millis"}`,
  time_dl_ms: (testData: any, t: any) =>
    `${Math.round(testData.time_dl_ms)} ${t["millis"] || "millis"}`,
  time_ul_ms: (testData: any, t: any) =>
    `${Math.round(testData.time_ul_ms)} ${t["millis"] || "millis"}`,

  duration_download_ms: (testData: any) =>
    `${Math.round(testData.duration_download_ms / 100) / 10} s`,
  duration_upload_ms: (testData: any) =>
    `${Math.round(testData.duration_upload_ms / 100) / 10} s`,

  ip_anonym: (testData: any) => {
    var ip = testData?.ip_anonym ?? ""
    //add ".x" to IPv4 addresses
    if (ip.indexOf("x") === -1 && ip.indexOf(".") > 0) {
      ip += ".x"
    }
    return ip
  },
  network_country: (testData: any, t: any) =>
    t[testData.network_country.toLowerCase()] || testData.network_country,
  sim_country: (testData: any, t: any) =>
    t[testData.sim_country.toLowerCase()] || testData.sim_country,
  country_geoip: (testData: any, t: any) =>
    t[testData.country_geoip.toLowerCase()] || testData.country_geoip,
  country_asn: (testData: any, t: any) =>
    t[testData.country_asn.toLowerCase()] || testData.country_asn,
  country_location: (testData: any, t: any) =>
    t[testData.country_location.toLowerCase()] || testData.country_location,

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
