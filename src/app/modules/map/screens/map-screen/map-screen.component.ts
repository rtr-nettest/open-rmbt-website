import { Component, inject, NgZone, signal } from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import {
  DEFAULT_CENTER,
  MapService,
  MapSourceOptions,
} from "../../services/map.service"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import {
  catchError,
  Observable,
  of,
  Subscription,
  takeUntil,
  tap,
  timeout,
} from "rxjs"
import {
  Map,
  NavigationControl,
  FullscreenControl,
  MapMouseEvent,
} from "maplibre-gl"
import { AsyncPipe } from "@angular/common"
import { FiltersComponent } from "../../components/filters/filters.component"
import { IMapInfo } from "../../interfaces/map-info.interface"
import { HeatmapLegendComponent } from "../../components/heatmap-legend/heatmap-legend.component"
import { SearchComponent } from "../../components/search/search.component"
import { MatDialog, MatDialogModule } from "@angular/material/dialog"
import { ScrollStrategyOptions } from "@angular/cdk/overlay"
import { FiltersControl } from "../../dto/filters-control"
import { BasemapControl } from "../../dto/basemap-control"
import { EBasemapType } from "../../constants/basemap-type.enum"
import { ETileTypes } from "../../constants/tile-type.enum"
import { BasemapPickerComponent } from "../../components/basemap-picker/basemap-picker.component"
import { MapStoreService } from "../../store/map-store.service"
import { toObservable } from "@angular/core/rxjs-interop"
import { MessageService } from "../../../shared/services/message.service"
import { PopupService } from "../../services/popup.service"
import { fromLonLat, toLonLat } from "ol/proj.js"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MainContentComponent } from "../../../shared/components/main-content/main-content.component"

export const POINTS_HEATMAP_SWITCH_LEVEL = 12

@Component({
  selector: "app-map-screen",
  imports: [
    AsyncPipe,
    HeaderComponent,
    HeatmapLegendComponent,
    TopNavComponent,
    BreadcrumbsComponent,
    FooterComponent,
    MatDialogModule,
    SearchComponent,
    TranslatePipe,
    MainContentComponent,
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
  mapStore = inject(MapStoreService)
  mapStoreBasemapSub = toObservable(this.mapStore.basemap)
    .pipe(
      takeUntil(this.destroyed$),
      tap((basemap) => {
        if (basemap) {
          this.switchBasemap(basemap)
        }
      })
    )
    .subscribe()
  messageService = inject(MessageService)
  popupService = inject(PopupService)
  resizeSub!: Subscription
  filters = toObservable(this.mapStore.filters)
    .pipe(
      takeUntil(this.destroyed$),
      tap((filters) => {
        if (filters) {
          this.mapSourceOptions = filters
          this.setTiles()
          this.setTilesVisibility()
        }
      })
    )
    .subscribe()
  mapError = signal("")
  text$: Observable<string> = this.i18nStore.getLocalizedHtml("map").pipe(
    tap(() => {
      this.mapService
        .getFilters()
        .pipe(
          timeout(5000),
          catchError((e) => {
            console.error(e)
            this.mapError.set(e)
            return of(null)
          })
        )
        .subscribe((mapInfo) => {
          if (globalThis.document && mapInfo) {
            this.mapInfo = mapInfo
            this.setSize()
            this.setMap().then(() => {
              this.setResizeSub()
              this.mapService.setCoordinatesAndZoom(
                this.map,
                new URLSearchParams(globalThis.location.search)
              )
            })
          }
        })
    })
  )
  zone = inject(NgZone)
  activeLayers: string[] = [
    this.mapService.getHeatmapSource({
      networkMeasurementType: "mobile/download",
    }),
    this.mapService.getPointSource({
      networkMeasurementType: "mobile/download",
    }),
  ]
  private readonly dialog = inject(MatDialog)
  private readonly scrollStrategyOptions = inject(ScrollStrategyOptions)

  private get heatmapAndPointsActive() {
    return (
      (!this.mapSourceOptions?.tiles ||
        this.mapSourceOptions?.tiles === ETileTypes.automatic) &&
      this.activeLayers.length === 2
    )
  }

  private async setMap() {
    const style = this.mapService.defaultStyle()
    if (!style.layers.length) {
      this.messageService.openSnackbar("Could not load the map style")
      return
    }
    this.zone.runOutsideAngular(() => {
      this.mapService
        .createMap({
          container: this.mapId,
          style,
          center: DEFAULT_CENTER,
          zoom: 6,
        })
        .pipe(takeUntil(this.destroyed$))
        .subscribe((map) => {
          this.map = map
          this.map.addControl(new FullscreenControl())
          this.map.addControl(new NavigationControl())
          this.map.addControl(
            new FiltersControl(this.i18nStore, () => {
              this.zone.run(() => {
                this.dialog.open(FiltersComponent, {
                  scrollStrategy: this.scrollStrategyOptions.noop(),
                })
              })
            })
          )
          this.map.addControl(
            new BasemapControl(this.i18nStore, () => {
              this.zone.run(() => {
                this.dialog.open(BasemapPickerComponent, {
                  scrollStrategy: this.scrollStrategyOptions.noop(),
                })
              })
            })
          )
          this.map.on("load", () => {
            this.mapStore.initFilters(this.mapInfo)
            this.map.on("zoom", () => {
              this.setTilesVisibility()
            })
            this.map.on("styledata", () => {
              this.setTilesVisibility()
            })
            this.map.on("click", this.onClick.bind(this))
            this.map.on("error", (event) => console.log(event))
          })
        })
    })
  }

  private setResizeSub() {
    this.resizeSub = this.mapService.getResizeSub(this.map, {
      takeUntil: this.destroyed$,
      onResize: () => this.setSize(),
    })
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

  switchBasemap(layerId: string) {
    this.zone.runOutsideAngular(() => {
      switch (layerId) {
        case EBasemapType.BMAPHDPI:
          this.map.setStyle(this.mapService.basemapAtHdpiStyle())
          break
        case EBasemapType.BMAPORTHO:
          this.map.setStyle(this.mapService.basemapAtOrthoStyle())
          break
        case EBasemapType.BMAPOVERLAY:
          this.map.setStyle(this.mapService.basemapAtOverlayStyle())
          break
        default:
          this.map.setStyle(this.mapService.defaultStyle())
          break
      }
      this.setTiles()
    })
  }

  private setTilesVisibility() {
    this.zone.runOutsideAngular(() => {
      if (this.heatmapAndPointsActive) {
        if (this.map.getZoom() < POINTS_HEATMAP_SWITCH_LEVEL) {
          // Hide points
          this.map.setLayoutProperty(this.activeLayers[1], "visibility", "none")
        } else {
          // Show points
          this.map.setLayoutProperty(
            this.activeLayers[1],
            "visibility",
            "visible"
          )
        }
      }
    })
  }

  private onClick = (e: MapMouseEvent & Object) => {
    if (
      (this.heatmapAndPointsActive &&
        this.map.getZoom() >= POINTS_HEATMAP_SWITCH_LEVEL) ||
      this.mapSourceOptions?.tiles === ETileTypes.points
    ) {
      const coordinates = fromLonLat([e.lngLat.lng, e.lngLat.lat])
      this.mapService
        .getMeasurementsAtPoint(this.map, coordinates, this.mapSourceOptions)
        .pipe(
          tap((measurements) => {
            if (
              !measurements.length ||
              !measurements[0].lat ||
              !measurements[0].long
            ) {
              return
            }
            const coordinates = toLonLat([
              measurements[0].lat,
              measurements[0].long,
            ]) as [number, number]
            this.popupService.addPopup(this.map, measurements, {
              lat: coordinates[1],
              lon: coordinates[0],
            })
          })
        )
        .subscribe()
    }
  }

  private setTiles() {
    let tiles: string[] = [...this.activeLayers]
    switch (this.mapSourceOptions?.tiles) {
      case ETileTypes.points:
        tiles = [this.mapService.getPointSource(this.mapSourceOptions)]
        break
      case ETileTypes.shapes:
        tiles = [this.mapService.getShapeSource(this.mapSourceOptions)]
        break
      case ETileTypes.heatmap:
        tiles = [this.mapService.getHeatmapSource(this.mapSourceOptions)]
        break
      case ETileTypes.automatic:
        tiles = [
          this.mapService.getHeatmapSource(this.mapSourceOptions),
          this.mapService.getPointSource(this.mapSourceOptions),
        ]
        break
    }
    this.zone.runOutsideAngular(() => {
      if (tiles) {
        if (this.activeLayers) {
          for (const layer of this.activeLayers) {
            if (this.map.getLayer(layer)) {
              this.map.removeLayer(layer)
            }
          }
          this.activeLayers = []
        }
        for (const layer of tiles) {
          try {
            this.map.addSource(layer, {
              type: "raster",
              tiles: [layer],
              tileSize: 256,
              maxzoom: 19,
            })
          } catch (e) {
            console.log(e)
          }
          try {
            this.map.addLayer({
              id: layer,
              type: "raster" as const,
              source: layer,
            })
            this.activeLayers.push(layer)
          } catch (e) {
            console.log(e)
          }
        }
      }
    })
  }
}
