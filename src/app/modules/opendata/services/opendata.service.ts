import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { MainStore } from "../../shared/store/main.store"
import { IOpendataFilters } from "../interfaces/opendata-filters.interface"
import { IRecentMeasurementsResponse } from "../interfaces/recent-measurements-response.interface"
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
import dayjs from "dayjs"
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
    this.router.navigateByUrl(
      `/${this.i18nStore.activeLang}/${
        ERoutes.OPEN_DATA
      }?${this.getSearchFromFilters(filters)}`
    )
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
    delete newFilters.timespan
    delete newFilters.timespan_unit
    return searchFromFilters(newFilters, {
      download_kbit_from: (value) => value * 1000,
      download_kbit_to: (value) => value * 1000,
      upload_kbit_from: (value) => value * 1000,
      upload_kbit_to: (value) => value * 1000,
      time_from: (value) => dayjs(value).utc().format(TIME_FORMAT),
      time_to: (value) => dayjs(value).utc().format(TIME_FORMAT),
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
