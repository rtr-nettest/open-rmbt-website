import { Component, computed, inject, OnInit, signal } from "@angular/core"
import {
  DEFAULT_FILTERS,
  OPEN_DATA_LIMIT,
  OpendataStoreService,
} from "../../store/opendata-store.service"
import { OpendataService } from "../../services/opendata.service"
import {
  concatMap,
  firstValueFrom,
  forkJoin,
  interval,
  map,
  of,
  takeUntil,
} from "rxjs"
import { toObservable } from "@angular/core/rxjs-interop"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { AsyncPipe } from "@angular/common"
import { ISort } from "../../../tables/interfaces/sort.interface"
import { LoadOnScrollComponent } from "../../../shared/components/load-on-scroll/load-on-scroll.component"
import { FiltersComponent } from "../../components/filters/filters.component"
import { LoadingOverlayComponent } from "../../../shared/components/loading-overlay/loading-overlay.component"
import { ExpansionPanelComponent } from "../../../shared/components/expansion-panel/expansion-panel.component"
import { IOpendataFilters } from "../../interfaces/opendata-filters.interface"
import { RECENT_MEASUREMENTS_COLUMNS } from "../../constants/recent-measurements-columns"
import { formatTime } from "../../../shared/adapters/app-date.adapter"
import { MapComponent } from "../../components/map/map.component"
import { HistogramComponent } from "../../components/histogram/histogram.component"
import { IntradayComponent } from "../../components/intraday/intraday.component"
import { IIntradayResponseItem } from "../../interfaces/intraday-response.interface"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { Router, RouterModule } from "@angular/router"
import { IRecentMeasurement } from "../../interfaces/recent-measurements-response.interface"
import { OpendataTableComponent } from "../../components/opendata-table/opendata-table.component"

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
    RouterModule,
    OpendataTableComponent,
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
  startMs = Date.now()
  apiLink = computed(() => {
    return `/${this.i18nStore.activeLang}/${ERoutes.INTERFACE}`
  })
  opendataStoreService = inject(OpendataStoreService)
  opendataService = inject(OpendataService)
  router = inject(Router)
  columns = RECENT_MEASUREMENTS_COLUMNS
  data$ = toObservable(this.opendataStoreService.data).pipe(
    map((data) => {
      const content: IRecentMeasurement[] = []
      for (const item of data) {
        content.push(formatTime(item))
      }
      return {
        content: data,
        totalElements: data?.length,
      }
    })
  )
  recentMeasurementSub = interval(5000)
    .pipe(takeUntil(this.destroyed$))
    .subscribe(() => {
      this.addRecentMeasurements()
    })
  filterCount = signal<string | null>(null)
  filters$ = toObservable(this.opendataStoreService.filters).pipe(
    concatMap((filters) => {
      this.updateFilterCount(filters)
      return forkJoin([of(filters), this.updateData({ reset: true })])
    }),
    map(([filters]) => filters)
  )
  loadHistograms = signal(false)
  loadMap = signal(false)
  loadIntraday = signal(false)
  loadingIntraday = signal(true)
  mapContainerId = "mapContainer"
  sort: ISort = { active: "times", direction: "desc" }
  intradayData = signal<IIntradayResponseItem[]>([])
  showUuids = signal(false)

  protected override get dataLimit(): number {
    return OPEN_DATA_LIMIT
  }

  protected override async fetchData(): Promise<Array<any>> {
    const filters = this.opendataStoreService.filters()
    const cursor = this.opendataStoreService.cursor()
    const newFilters = { ...DEFAULT_FILTERS, ...filters, cursor }
    return firstValueFrom(
      this.opendataService.search(newFilters).pipe(
        map((response) => {
          this.opendataStoreService.cursor.set(response.next_cursor)
          this.opendataStoreService.data.set([
            ...this.opendataStoreService.data(),
            ...response.results,
          ])
          return response.results
        })
      )
    )
  }

  ngOnInit(): void {
    this.opendataService.initFilters()
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy()
    this.opendataStoreService.reset()
  }

  loadIntradayData(load: boolean) {
    this.loadIntraday.set(true)
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

  handleRowClick = (row: IRecentMeasurement) => {
    this.router.navigate([this.i18nStore.activeLang, ERoutes.OPEN_RESULT], {
      queryParams: { open_test_uuid: row.open_test_uuid },
    })
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

  private addRecentMeasurements() {
    const filters = this.opendataStoreService.filters()
    firstValueFrom(
      this.opendataService.search({ ...DEFAULT_FILTERS, ...filters })
    ).then((resp) => {
      const oldContent = this.opendataStoreService.data()
      let newContent = resp?.results?.length ? resp.results : []
      const lastTestUuid = newContent[newContent.length - 1]?.open_test_uuid
      const lastOldItemIndex = oldContent.findIndex(
        (item) => item.open_test_uuid === lastTestUuid
      )
      if (lastOldItemIndex !== -1) {
        newContent = newContent.concat(oldContent.slice(lastOldItemIndex + 1))
      }
      this.opendataStoreService.data.set(newContent)
    })
  }
}
