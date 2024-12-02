import { AfterViewInit, Component, inject, NgZone, OnInit } from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import {
  DEFAULT_CENTER,
  DEFAULT_STYLE,
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

@Component({
  selector: "app-map-screen",
  standalone: true,
  imports: [
    AsyncPipe,
    HeaderComponent,
    TopNavComponent,
    BreadcrumbsComponent,
    FooterComponent,
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

  ngAfterViewInit(): void {
    this.mapService.getFilters().subscribe()
    if (globalThis.document) {
      this.setSize()
      this.setResizeSub()
      this.setMap()
    }
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
        this.setMeasurements()
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

  private setMeasurements() {
    let tiles: string = ""
    const networkMeasurementType = "mobile/download"
    if (!this.mapSourceOptions) {
      tiles = this.mapService.getHeatmapSource({
        networkMeasurementType,
      })
      console.log("layer", tiles)
    }
    this.zone.runOutsideAngular(() => {
      if (tiles) {
        try {
          this.map.addSource(networkMeasurementType, {
            type: "raster",
            tiles: [tiles],
            tileSize: 256,
            maxzoom: 19,
          })
        } catch (e) {
          console.log(e)
        }
        try {
          this.map.addLayer({
            id: networkMeasurementType,
            type: "raster" as const,
            source: networkMeasurementType,
          })
        } catch (e) {
          console.log(e)
        }
      }
    })
  }
}
