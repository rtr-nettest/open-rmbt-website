import { ITableColumn } from "../../tables/interfaces/table-column.interface"
import { IRecentMeasurement } from "../interfaces/recent-measurements-response.interface"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
import { truncate } from "../../shared/util/string"
import { roundToSignificantDigits } from "../../shared/util/math"
dayjs.extend(utc)
dayjs.extend(tz)

export const RECENT_MEASUREMENTS_COLUMNS: Array<
  ITableColumn<IRecentMeasurement>
> = [
  {
    columnDef: "date_time",
    header: "Time",
    isHtml: true,
    getNgClass: () => "app-cell app-cell--20",
    transformValue(value) {
      return `<i class="app-icon app-icon--browser"></i><span>${value.time}</span>`
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
      return `<i class="app-icon app-icon--marker"></i><span class="app-marker-cell">${retVal}</span>`
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
