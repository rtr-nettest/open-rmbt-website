import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { MainStore } from "../../shared/store/main.store"
import { IOpendataFilters } from "../interfaces/opendata-filters.interface"
import {
  IRecentMeasurement,
  IRecentMeasurementsResponse,
} from "../interfaces/recent-measurements-response.interface"
import { ITableColumn } from "../../tables/interfaces/table-column.interface"
import { roundToSignificantDigits } from "../../shared/util/math"
import { map } from "rxjs"
import {
  DEFAULT_FILTERS,
  OpendataStoreService,
} from "../store/opendata-store.service"
import { I18nStore } from "../../i18n/store/i18n.store"
import { Router } from "@angular/router"
import { ERoutes } from "../../shared/constants/routes.enum"
import {
  filtersFromSearch,
  searchFromFilters,
} from "../../shared/util/query-params"
import { truncate } from "../../shared/util/string"
import dayjs, { ManipulateType } from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
dayjs.extend(utc)
dayjs.extend(tz)

const TIME_FORMAT = "YYYY-MM-DD HH:mm:ss"

@Injectable({
  providedIn: "root",
})
export class OpendataService {
  constructor(
    private readonly i18nStore: I18nStore,
    private readonly mainStore: MainStore,
    private readonly store: OpendataStoreService,
    private readonly http: HttpClient,
    private readonly router: Router
  ) {}

  getColumns(options?: {
    showTimeOnly?: boolean
  }): ITableColumn<IRecentMeasurement>[] {
    return [
      {
        columnDef: "date_time",
        header: "Time",
        isHtml: true,
        getNgClass: () => "app-cell app-cell--20",
        transformValue(value) {
          const dateFormat = options?.showTimeOnly
            ? "HH:mm:ss"
            : "YYYY-MM-DD HH:mm:ss"
          const retVal = dayjs(value.time)
            .utc(true)
            .tz(dayjs.tz.guess())
            .format(dateFormat)
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
              ? `${truncate(retVal, 50)} (${value.platform.trim()})`
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
      {
        columnDef: "signal_strength",
        header: "Signal (dBm)",
        justify: "flex-end",
      },
    ]
  }

  initFilters() {
    if (!globalThis?.location) return
    const search = location.search.slice(1)
    if (search) {
      this.store.filters.set(this.getFiltersFromSearch(search))
    }
  }

  applyFilters(filters?: IOpendataFilters) {
    if (!filters) return
    this.store.reset()
    this.store.filters.set(filters)
    // this.router.navigateByUrl(
    //   `/${this.i18nStore.activeLang}/${
    //     ERoutes.OPEN_DATA
    //   }?${this.getSearchFromFilters(filters)}`
    // )
  }

  search(filters: IOpendataFilters) {
    return this.http
      .get<IRecentMeasurementsResponse>(
        `${
          this.mainStore.api().url_web_statistic_server
        }/opentests/search?${this.getSearchFromFilters({
          ...DEFAULT_FILTERS,
          ...filters,
        })}`
      )
      .pipe(
        map((response) => {
          this.store.cursor.set(response.next_cursor)
          this.store.data.set([...this.store.data(), ...response.results])
          return response.results
        })
      )
  }

  private getSearchFromFilters(filters: IOpendataFilters) {
    const newFilters = JSON.parse(JSON.stringify(filters))
    if (newFilters.timespan && newFilters.timespan_unit) {
      const now = newFilters.time_to
        ? dayjs(newFilters.time_to)
        : dayjs().endOf("day")
      newFilters.time_from = now
        .subtract(
          newFilters.timespan,
          newFilters.timespan_unit as ManipulateType
        )
        .toDate()
    }
    return searchFromFilters(newFilters, {
      download_kbit_from: (value) => `>${value * 1000}`,
      download_kbit_to: (value) => `<${value * 1000}`,
      upload_kbit_from: (value) => `>${value * 1000}`,
      upload_kbit_to: (value) => `<${value * 1000}`,
      time_from: (value) => `>${dayjs(value).utc().format(TIME_FORMAT)}`,
      time_to: (value) => `<${dayjs(value).utc().format(TIME_FORMAT)}`,
    })
  }

  private getFiltersFromSearch(search: string) {
    return filtersFromSearch(search, {
      download_kbit_from: (value) => value / 1000,
      download_kbit_to: (value) => value / 1000,
      upload_kbit_from: (value) => value / 1000,
      upload_kbit_to: (value) => value / 1000,
      time_from: (value) => dayjs(value).utc(true).toDate(),
      time_to: (value) => dayjs(value).utc(true).toDate(),
    })
  }
}
