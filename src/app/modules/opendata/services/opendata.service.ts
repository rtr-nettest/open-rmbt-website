import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { MainStore } from "../../shared/store/main.store"
import { IOpendataFilters } from "../interfaces/opendata-filters.interface"
import { searchFromFilters } from "../../shared/util/search"
import {
  IRecentMeasurement,
  IRecentMeasurementsResponse,
} from "../interfaces/recent-measurements-response.interface"
import { ITableColumn } from "../../tables/interfaces/table-column.interface"
import { roundToSignificantDigits } from "../../shared/util/math"
import dayjs from "dayjs"

@Injectable({
  providedIn: "root",
})
export class OpendataService {
  constructor(
    private readonly mainStore: MainStore,
    private readonly http: HttpClient
  ) {}

  getColumns(): ITableColumn<IRecentMeasurement>[] {
    return [
      {
        columnDef: "time",
        header: "Time",
        isHtml: true,
        transformValue(value) {
          const retVal = dayjs(value.time)
            .utc(true)
            .tz(dayjs.tz.guess())
            .format("HH:mm:ss")
          return `<i class="app-icon app-icon--browser"></i><span>${retVal}</span>`
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
              ? `${retVal} (${value.platform.trim()})`
              : value.platform.trim()
          }
          return `<i class="app-icon app-icon--marker"></i><span class="app-marker-cell">${retVal}</span>`
        },
      },
      {
        columnDef: "download",
        header: "Down (Mbps)",
        transformValue: (value) => {
          return roundToSignificantDigits(value.download_kbit / 1000)
        },
        justify: "flex-end",
      },
      {
        columnDef: "upload",
        header: "Up (Mbps)",
        transformValue: (value) => {
          return roundToSignificantDigits(value.upload_kbit / 1000)
        },
        justify: "flex-end",
      },
      {
        columnDef: "ping",
        header: "Ping (ms)",
        transformValue: (value) => {
          return Math.round(value.ping_ms)
        },
        justify: "flex-end",
      },
    ]
  }

  search(filters: IOpendataFilters) {
    return this.http.get<IRecentMeasurementsResponse>(
      `${
        this.mainStore.api().url_web_statistic_server
      }/opendata/search?${searchFromFilters(filters)}`
    )
  }
}
