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
  fromEvent,
  Observable,
  of,
  Subscription,
  takeUntil,
  tap,
} from "rxjs"
import { Map, NavigationControl, FullscreenControl } from "maplibre-gl"
import { AsyncPipe } from "@angular/common"
import { FiltersComponent } from "../../components/filters/filters.component"

@Component({
  selector: "app-map-screen",
  standalone: true,
  imports: [
    AsyncPipe,
    HeaderComponent,
    TopNavComponent,
    BreadcrumbsComponent,
    FooterComponent,
    FiltersComponent,
  ],
  templateUrl: "./map-screen.component.html",
  styleUrl: "./map-screen.component.scss",
})
export class MapScreenComponent extends SeoComponent implements AfterViewInit {
  map!: Map
  mapContainerId = "mapContainer"
  mapId = "map"
  mapService = inject(MapService)
  mapSourceOptions?: MapSourceOptions
  resizeSub!: Subscription
  text$: Observable<string> = this.i18nStore.getLocalizedHtml("map")
  zone = inject(NgZone)
  activeLayer?: string

  ngAfterViewInit(): void {
    if (globalThis.document) {
      this.setSize()
      this.setResizeSub()
      this.setMap()
    }
  }

  switchLayers(event: MapSourceOptions) {
    this.mapSourceOptions = event
    this.setTiles()
  }

  private setMap() {
    this.zone.runOutsideAngular(() => {
      this.map = new Map({
        container: this.mapId,
        style: DEFAULT_STYLE,
        center: DEFAULT_CENTER,
        zoom: 6,
      })
      this.map.addControl(new NavigationControl())
      this.map.addControl(new FullscreenControl())
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
        .setAttribute("style", `height:440px;width:${containerWidth - 16}px`)
    })
  }

  private setTiles() {
    let tiles: string = ""
    const defaultOptions: MapSourceOptions = {
      networkMeasurementType: "mobile/download",
    }
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
      default:
        tiles = this.mapService.getHeatmapSource(defaultOptions)
        break
    }
    const tilesId = JSON.stringify(tiles)
    this.zone.runOutsideAngular(() => {
      if (tiles) {
        try {
          this.map.addSource(tilesId, {
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
            id: tilesId,
            type: "raster" as const,
            source: tilesId,
          })
          this.activeLayer = tilesId
        } catch (e) {
          console.log(e)
        }
      }
    })
  }
}
