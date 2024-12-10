import { AfterViewInit, Component, inject, NgZone, OnInit } from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import {
  DEFAULT_CENTER,
  DEFAULT_STYLE,
  ETileTypes,
  MapService,
  MapSourceOptions,
} from "../../services/map.service"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import {
  catchError,
  debounceTime,
  firstValueFrom,
  fromEvent,
  Observable,
  of,
  Subscription,
  takeUntil,
  tap,
} from "rxjs"
import {
  Map,
  NavigationControl,
  FullscreenControl,
  IControl,
} from "maplibre-gl"
import { AsyncPipe } from "@angular/common"
import {
  FiltersComponent,
  FilterSheetData,
} from "../../components/filters/filters.component"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { IMapInfo } from "../../interfaces/map-info.interface"
import { HeatmapLegendComponent } from "../../components/heatmap-legend/heatmap-legend.component"
import { SearchComponent } from "../../components/search/search.component"
import { MatDialog, MatDialogModule } from "@angular/material/dialog"
import { ScrollStrategyOptions } from "@angular/cdk/overlay"

@Component({
  selector: "app-map-screen",
  standalone: true,
  imports: [
    AsyncPipe,
    HeaderComponent,
    HeatmapLegendComponent,
    TopNavComponent,
    BreadcrumbsComponent,
    FooterComponent,
    MatDialogModule,
    SearchComponent,
  ],
  templateUrl: "./map-screen.component.html",
  styleUrl: "./map-screen.component.scss",
})
export class MapScreenComponent extends SeoComponent {
  map!: Map
  mapContainerId = "mapContainer"
  mapId = "map"
  mapService = inject(MapService)
  mapInfo!: IMapInfo
  mapSourceOptions?: MapSourceOptions
  resizeSub!: Subscription
  text$: Observable<string> = this.i18nStore.getLocalizedHtml("map").pipe(
    tap(() => {
      firstValueFrom(this.mapService.getFilters()).then((mapInfo) => {
        if (globalThis.document) {
          this.mapInfo = mapInfo
          this.setSize()
          this.setResizeSub()
          this.setMap()
        }
      })
    })
  )
  zone = inject(NgZone)
  activeLayer = this.mapService.getHeatmapSource({
    networkMeasurementType: "mobile/download",
  })
  private readonly dialog = inject(MatDialog)
  private readonly scrollStrategyOptions = inject(ScrollStrategyOptions)

  switchLayers(event: MapSourceOptions) {
    this.mapSourceOptions = event
    this.setTiles()
  }

  private setMap() {
    this.zone.runOutsideAngular(async () => {
      this.map = new Map({
        container: this.mapId,
        style: DEFAULT_STYLE,
        center: DEFAULT_CENTER,
        zoom: 6,
      })
      this.map.addControl(new FullscreenControl())
      this.map.addControl(new NavigationControl())
      this.map.addControl(
        new FiltersControl(this.i18nStore, () => {
          this.zone.run(() => {
            this.dialog.open(FiltersComponent, {
              data: {
                mapInfo: this.mapInfo,
                onFiltersChange: (filters: MapSourceOptions) =>
                  this.switchLayers(filters),
              } as FilterSheetData,
              scrollStrategy: this.scrollStrategyOptions.noop(),
            })
          })
        })
      )
      this.map.on("load", () => {
        this.setTiles()
      })
    })
  }

  private setResizeSub() {
    this.resizeSub = fromEvent(window, "resize")
      .pipe(
        takeUntil(this.destroyed$),
        debounceTime(300),
        tap(() => this.setSize()),
        tap(() => {
          setTimeout(() => {
            this.zone.runOutsideAngular(() => this.map.resize())
          }, 300)
        }),
        catchError((err) => {
          console.log(err)
          return of(err)
        })
      )
      .subscribe()
  }

  private setSize() {
    this.zone.runOutsideAngular(() => {
      if (!this.mapContainerId) {
        return
      }
      let containerWidth = document
        .getElementById(this.mapContainerId)!
        .getBoundingClientRect().width
      document
        .getElementById(this.mapId)!
        .setAttribute("style", `height:440px;width:${containerWidth}px`)
    })
  }

  private setTiles() {
    let tiles: string = this.activeLayer
    switch (this.mapSourceOptions?.tiles) {
      case ETileTypes.points:
        tiles = this.mapService.getPointSource(this.mapSourceOptions)
        break
      case ETileTypes.cadastral:
        tiles = this.mapService.getShapeSource(this.mapSourceOptions)
        break
      case ETileTypes.automatic:
      case ETileTypes.heatmap:
        tiles = this.mapService.getHeatmapSource(this.mapSourceOptions)
        break
    }
    this.zone.runOutsideAngular(() => {
      if (tiles) {
        try {
          this.map.addSource(tiles, {
            type: "raster",
            tiles: [tiles],
            tileSize: 256,
            maxzoom: 19,
          })
        } catch (e) {
          console.log(e)
        }
        try {
          if (this.activeLayer && this.map.getLayer(this.activeLayer)) {
            this.map.removeLayer(this.activeLayer)
          }
          this.map.addLayer({
            id: tiles,
            type: "raster" as const,
            source: tiles,
          })
          this.activeLayer = tiles
        } catch (e) {
          console.log(e)
        }
      }
    })
  }
}

export class FiltersControl implements IControl {
  private map: Map | undefined
  private container!: HTMLElement

  constructor(private i18nStore: I18nStore, private onClick: () => void) {}

  onAdd(map: Map) {
    this.map = map
    this.container = document.createElement("div")
    this.container.className = "maplibregl-ctrl maplibregl-ctrl-group"
    this.container.innerHTML = `<button class="maplibregl-ctrl-filters" type="button" aria-label="${this.i18nStore.translate(
      "Show filters"
    )}" title="${this.i18nStore.translate(
      "Show filters"
    )}"><mat-icon role="img" fontset="material-symbols-outlined" class="mat-icon notranslate material-symbols-outlined mat-icon-no-color" aria-hidden="true" data-mat-icon-type="font" data-mat-icon-namespace="material-symbols-outlined">tune</mat-icon></button>`
    this.container.onclick = () => {
      this.onClick()
    }
    return this.container
  }

  onRemove() {
    this.container.parentNode?.removeChild(this.container)
    this.map = undefined
  }
}
