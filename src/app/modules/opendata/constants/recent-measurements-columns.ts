import { ITableColumn } from "../../tables/interfaces/table-column.interface"
import { IRecentMeasurement } from "../interfaces/recent-measurements-response.interface"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
import { truncate } from "../../shared/util/string"
import { roundToSignificantDigits } from "../../shared/util/math"
dayjs.extend(utc)
dayjs.extend(tz)

export const MIN_ACCURACY_FOR_SHOWING_MAP = 2000

export const getNetworkIcon = (testdata: IRecentMeasurement) => {
  let img = "<i class='svg-icon svg14'></i>"
  let svgType = ""
  if (testdata.platform.indexOf("WLAN") !== -1) {
    svgType = "wlan4"
  } else if (testdata.platform.indexOf("LAN") !== -1) {
    svgType = "browser"
  } else if (testdata.platform.indexOf("/") !== -1) {
    svgType = "mobile"
  } else if (testdata.platform.indexOf("5G") !== -1) {
    svgType = "5g"
  } else if (testdata.platform.indexOf("4G") !== -1) {
    svgType = "4g"
  } else if (testdata.platform.indexOf("3G") !== -1) {
    svgType = "3g"
  } else if (testdata.platform.indexOf("2G") !== -1) {
    svgType = "2g"
  }

  if (testdata.hasOwnProperty("signal_classification")) {
    svgType += "-" + testdata.signal_classification
  } else if (testdata.platform.indexOf("WLAN") !== -1) {
    svgType = "wlan3"
  } else if (testdata.platform.indexOf("LAN") == -1) {
    svgType += "-0"
  }

  img = img.replace("svg-icon", `svg-icon svg-${svgType}`)
  return img
}

export const getPositionMarker = (testdata: IRecentMeasurement) => {
  let position_marker = ""
  if (testdata.long !== null) {
    let image =
      testdata.loc_accuracy <= MIN_ACCURACY_FOR_SHOWING_MAP
        ? "svg-marker"
        : "svg-marker-line"
    position_marker = "<i class='svg-icon svg14 " + image + "'></i>"
  }
  return position_marker
}

export const RECENT_MEASUREMENTS_COLUMNS: Array<
  ITableColumn<IRecentMeasurement>
> = [
  {
    columnDef: "date_time",
    header: "Time",
    isHtml: true,
    getNgClass: () => "app-cell app-cell--20",
    transformValue(value) {
      return `${getNetworkIcon(value)}<span>${value.time}</span>`
    },
  },
  {
    columnDef: "platform",
    header: "Provider/device",
    isHtml: true,
    transformValue(value) {
      const arr = []
      let retVal = ""
      if (value.provider_name) {
        arr.push(value.provider_name.trim())
      }
      if (value.model) {
        arr.push(value.model.trim())
      }
      if (arr.length) {
        retVal = arr.join(", ")
      }
      if (value.platform) {
        retVal = retVal.length
          ? `${truncate(retVal, 50)} (${value.platform.trim()})`
          : value.platform.trim()
      }
      return `${getPositionMarker(
        value
      )}<span class="app-marker-cell">${retVal}</span>`
    },
  },
  {
    columnDef: "download",
    getNgClass: () => "app-cell app-cell--flex-10",
    header: "Down (Mbps)",
    transformValue: (value) => {
      return roundToSignificantDigits(value.download_kbit / 1000)
    },
    justify: "flex-end",
  },
  {
    columnDef: "upload",
    getNgClass: () => "app-cell app-cell--flex-10",
    header: "Up (Mbps)",
    transformValue: (value) => {
      return roundToSignificantDigits(value.upload_kbit / 1000)
    },
    justify: "flex-end",
  },
  {
    columnDef: "ping",
    getNgClass: () => "app-cell app-cell--flex-10",
    header: "Ping (ms)",
    transformValue: (value) => {
      return Math.round(value.ping_ms)
    },
    justify: "flex-end",
  },
  {
    columnDef: "signal_strength",
    getNgClass: () => "app-cell app-cell--flex-10",
    header: "Signal (dBm)",
    justify: "flex-end",
  },
]
