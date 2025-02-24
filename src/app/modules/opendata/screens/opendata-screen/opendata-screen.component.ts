import { Component, inject, OnInit, signal } from "@angular/core"
import {
  DEFAULT_FILTERS,
  OPEN_DATA_LIMIT,
  OpendataStoreService,
} from "../../store/opendata-store.service"
import { OpendataService } from "../../services/opendata.service"
import { concatMap, firstValueFrom, forkJoin, map, of } from "rxjs"
import { toObservable } from "@angular/core/rxjs-interop"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { AsyncPipe } from "@angular/common"
import { TableComponent } from "../../../tables/components/table/table.component"
import { ISort } from "../../../tables/interfaces/sort.interface"
import { LoadOnScrollComponent } from "../../../shared/components/load-on-scroll/load-on-scroll.component"
import { FiltersComponent } from "../../components/filters/filters.component"
import { LoadingOverlayComponent } from "../../../shared/components/loading-overlay/loading-overlay.component"
import { ExpansionPanelComponent } from "../../../shared/components/expansion-panel/expansion-panel.component"
import { IOpendataFilters } from "../../interfaces/opendata-filters.interface"
import { RECENT_MEASUREMENTS_COLUMNS } from "../../constants/recent-measurements-columns"
import { IRecentMeasurement } from "../../interfaces/recent-measurements-response.interface"
import { APP_DATE_TIME_FORMAT } from "../../../shared/adapters/app-date.adapter"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
import { MapComponent } from "../../components/map/map.component"
import { HistogramComponent } from "../../components/histogram/histogram.component"
import { fork } from "child_process"
import { IntradayComponent } from "../../components/intraday/intraday.component"
import { IIntradayResponseItem } from "../../interfaces/intraday-response.interface"
dayjs.extend(utc)
dayjs.extend(tz)

@Component({
  selector: "app-opendata-screen",
  imports: [
    AsyncPipe,
    BreadcrumbsComponent,
    ExpansionPanelComponent,
    HeaderComponent,
    HistogramComponent,
    IntradayComponent,
    FiltersComponent,
    FooterComponent,
    LoadingOverlayComponent,
    MapComponent,
    TableComponent,
    TopNavComponent,
    TranslatePipe,
    HistogramComponent,
  ],
  templateUrl: "./opendata-screen.component.html",
  styleUrl: "./opendata-screen.component.scss",
})
export class OpendataScreenComponent
  extends LoadOnScrollComponent
  implements OnInit
{
  opendataStoreService = inject(OpendataStoreService)
  opendataService = inject(OpendataService)
  columns = RECENT_MEASUREMENTS_COLUMNS
  data$ = toObservable(this.opendataStoreService.data).pipe(
    map((data) => {
      const content = data?.map(this.formatTime)
      return {
        content,
        totalElements: content?.length,
      }
    })
  )
  filterCount = signal("")
  filters$ = toObservable(this.opendataStoreService.filters).pipe(
    concatMap((filters) => {
      this.updateFilterCount(filters)
      return forkJoin([of(filters), this.updateData({ reset: true })])
    }),
    map(([filters]) => filters)
  )
  loadHistograms = signal(false)
  loadMap = signal(false)
  loadingIntraday = signal(true)
  mapContainerId = "mapContainer"
  sort: ISort = { active: "times", direction: "desc" }
  intradayData = signal<IIntradayResponseItem[]>([])

  protected override get dataLimit(): number {
    return OPEN_DATA_LIMIT
  }

  protected override async fetchData(): Promise<Array<any>> {
    const filters = this.opendataStoreService.filters()
    const cursor = this.opendataStoreService.cursor()
    return firstValueFrom(this.opendataService.search({ ...filters, cursor }))
  }

  ngOnInit(): void {
    this.opendataService.initFilters()
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy()
    this.opendataStoreService.reset()
  }

  loadIntradayData(load: boolean) {
    if (load) {
      this.loadingIntraday.set(true)
      firstValueFrom(
        this.opendataService.getIntraday({
          ...this.opendataStoreService.filters(),
        })
      )
        .then((data) => this.intradayData.set(data))
        .finally(() => this.loadingIntraday.set(false))
    }
  }

  private formatTime = (value: IRecentMeasurement) => {
    const time = dayjs(value.time)
      .utc(true)
      .tz(dayjs.tz.guess())
      .format(APP_DATE_TIME_FORMAT)
    return { ...value, time }
  }

  private updateFilterCount(filters: IOpendataFilters) {
    const filtersCount = Object.keys(filters).filter(
      (k) =>
        !(k in DEFAULT_FILTERS) &&
        !k.startsWith("timespan") &&
        (filters as any)[k]
    ).length
    this.filterCount.set(filtersCount > 0 ? ` (${filtersCount})` : "")
  }
}
