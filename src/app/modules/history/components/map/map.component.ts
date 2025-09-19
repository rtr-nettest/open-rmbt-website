import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  effect,
  input,
  signal,
} from "@angular/core"
import { firstValueFrom, Subject, Subscription, takeUntil } from "rxjs"
import { DEFAULT_CENTER, MapService } from "../../../map/services/map.service"
import { Map, NavigationControl } from "maplibre-gl"
import { MatButtonModule } from "@angular/material/button"
import { MatDialog } from "@angular/material/dialog"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { ScrollStrategyOptions } from "@angular/cdk/overlay"
import { CoverageDialogComponent } from "../coverage-dialog/coverage-dialog.component"
import { HistoryRepositoryService } from "../../repository/history-repository.service"
import { IBasicResponse } from "../../../tables/interfaces/basic-response.interface"
import { ICoverage } from "../../interfaces/coverage.interface"
import { ISimpleHistoryTestLocation } from "../../interfaces/simple-history-result.interface"

@Component({
  selector: "app-map",
  imports: [MatButtonModule, TranslatePipe],
  templateUrl: "./map.component.html",
  styleUrl: "./map.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements AfterViewInit {
  destroyed$ = new Subject<void>()
  locations = input.required<ISimpleHistoryTestLocation[]>()
  coordinates = computed(() =>
    this.locations().map((loc) => [loc.long, loc.lat] as [number, number])
  )
  mapContainerId = input.required<string>()
  mapId = "map"
  map!: Map
  params = input.required<URLSearchParams>()
  resizeSub!: Subscription
  coverages = signal<IBasicResponse<ICoverage> | null>(null)
  lat = computed(() => this.params().get("lat"))
  lon = computed(() => this.params().get("long"))
  showPath = input<boolean>(false)
  pathMarkers: maplibregl.Marker[] = []

  get href() {
    const search = [
      `lat=${this.lat()}`,
      `long=${this.lon()}`,
      `radius=700`,
      `loc_accuracy=<700`,
    ]
    return `/${this.i18nStore.activeLang}/${ERoutes.OPEN_DATA}?${search.join(
      "&"
    )}`
  }

  constructor(
    private readonly dialog: MatDialog,
    private readonly i18nStore: I18nStore,
    private readonly mapService: MapService,
    private readonly repo: HistoryRepositoryService,
    private readonly scrollStrategyOptions: ScrollStrategyOptions
  ) {
    effect(() => {
      const lon = +this.lon()!
      const lat = +this.lat()!
      firstValueFrom(this.repo.getCoverages(lon, lat)).then((res) => {
        if (!res?.coverages.length) {
          this.coverages.set(null)
          return
        }
        this.coverages.set({
          content: res.coverages,
          totalElements: res.coverages.length,
        })
      })
    })
    effect(() => {
      if (this.showPath() && this.map) {
        this.addPath()
      } else {
        this.removePath()
      }
    })
  }

  ngAfterViewInit(): void {
    if (globalThis.document) {
      this.setSize()
      this.setMap()
      this.setResizeSub()
      this.addMarker()
      this.mapService.setCoordinatesAndZoom(this.map, this.params())
    }
  }

  async showCoverageDialog() {
    this.dialog.open(CoverageDialogComponent, {
      data: { query: this.params(), coverages: this.coverages() },
      panelClass: "app-coverage-dialog",
      scrollStrategy: this.scrollStrategyOptions.noop(),
    })
  }

  private setResizeSub() {
    this.resizeSub = this.mapService.getResizeSub(this.map, {
      takeUntil: this.destroyed$,
      onResize: () => this.setSize(),
    })
  }

  private setSize() {
    if (!this.mapContainerId) {
      return
    }
    document
      .getElementById(this.mapId)!
      .setAttribute("style", `height:350px;width:100%`)
  }

  private setMap() {
    this.mapService
      .createMap({
        container: this.mapId,
        style: this.mapService.getLineStyle(this.coordinates()),
        center: DEFAULT_CENTER,
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe((map) => {
        this.map = map
        this.map.addControl(new NavigationControl())
      })
  }

  private addMarker() {
    const lon = this.lon()
    const lat = this.lat()
    if (!lon && !lat) {
      return
    }
    this.mapService.addMarker(this.map, {
      lon: parseFloat(lon!),
      lat: parseFloat(lat!),
      diameter: 24,
      zIndex: 1,
    })
  }

  private addPath() {
    if (!this.map) {
      return
    }
    if (this.coordinates().length < 2) {
      return
    }
    this.pathMarkers = this.mapService.addPathMarkers(
      this.map,
      this.coordinates()
    )
    this.mapService.addLineLayer(this.map)
    this.mapService.fitBounds(this.map, this.coordinates())
  }

  private async removePath() {
    if (!this.map) {
      return
    }
    for (const marker of this.pathMarkers) {
      marker.remove()
    }
    this.pathMarkers = []
    this.mapService.removeLineLayer(this.map)
  }
}
