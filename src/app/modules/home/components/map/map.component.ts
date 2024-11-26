import {
  AfterViewInit,
  Component,
  inject,
  Input,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from "@angular/core"
import { IRecentMeasurementsResponse } from "../../interfaces/recent-measurements-response.interface"
import {
  catchError,
  debounceTime,
  firstValueFrom,
  fromEvent,
  of,
  Subject,
  Subscription,
  takeUntil,
  tap,
} from "rxjs"
import { Marker, Map, StyleSpecification } from "maplibre-gl"
import { bbox } from "@turf/bbox"
import { lineString } from "@turf/helpers"
import { HttpClient } from "@angular/common/http"
import { PopupService } from "../../services/popup.service"

const center: [number, number] = [13.786457000803567, 47.57838319858735]
const baseMap = "https://mapsneu.wien.gv.at/basemapvectorneu/root.json"
const style: StyleSpecification = {
  version: 8 as const,
  sources: {
    osm: {
      type: "raster" as const,
      tiles: ["https://a.tile.openstreetmap.org/{z}/{x}/{y}.png"],
      tileSize: 256,
      attribution: "&copy; OpenStreetMap Contributors",
      maxzoom: 19,
    },
  },
  layers: [
    {
      id: "osm",
      type: "raster" as const,
      source: "osm", // This must match the source key above
    },
  ],
}

@Component({
  selector: "app-map",
  standalone: true,
  imports: [],
  templateUrl: "./map.component.html",
  styleUrl: "./map.component.scss",
})
export class MapComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input({ required: true }) measurements: IRecentMeasurementsResponse | null =
    null
  @Input() mapContainerId?: string
  cachedMarkers: Marker[] = []
  destroyed$ = new Subject<void>()
  http = inject(HttpClient)
  mapId = "map"
  map!: Map
  popup = inject(PopupService)
  resizeSub!: Subscription

  ngOnChanges(changes: SimpleChanges): void {
    if ("measurements" in changes && this.map) {
      this.setMeasurements()
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }

  ngAfterViewInit(): void {
    if (globalThis.document) {
      this.setSize()
      this.setResizeSub()
      this.setMap()
    }
  }

  private setMap() {
    this.map = new Map({
      container: "map",
      style: style,
      center,
      zoom: 3,
    })
  }

  private setResizeSub() {
    this.resizeSub = fromEvent(window, "resize")
      .pipe(
        takeUntil(this.destroyed$),
        debounceTime(300),
        tap(() => this.setSize()),
        tap(() => {
          setTimeout(() => this.map.resize(), 300)
        }),
        catchError((err) => {
          console.log(err)
          return of(err)
        })
      )
      .subscribe()
  }

  private setSize() {
    if (!this.mapContainerId) {
      return
    }
    let containerWidth = document
      .getElementById(this.mapContainerId)!
      .getBoundingClientRect().width
    if (window.innerWidth > 904.98) {
      containerWidth = containerWidth / 2
    }
    document
      .getElementById(this.mapId)!
      .setAttribute("style", `height:440px;width:${containerWidth - 24}px`)
  }

  // TODO: see if raster works
  private async setBaseMap() {
    try {
      const style: StyleSpecification = await firstValueFrom(
        this.http.get<StyleSpecification>(baseMap)
      )
      this.map.on("load", () => {
        this.map.addSource("esri", style.sources["esri"])
        for (const layer of style.layers) {
          if (!this.map.getLayer(layer.id)) this.map.addLayer(layer)
        }
      })
    } catch (err) {
      console.log(err)
    }
  }

  private setMeasurements() {
    if (this.measurements?.results?.length) {
      this.cachedMarkers.forEach((m) => m.remove())
      const features: [number, number][] = []
      this.cachedMarkers = this.measurements.results.reverse().map((m, i) => {
        const el = document.createElement("div")
        el.className = "app-marker"
        el.style.backgroundImage = `url(${this.getIconByClass(
          m.download_classification
        )})`
        el.style.width =
          i == this.measurements!.results.length - 1 ? `24px` : `18px`
        el.style.height =
          i == this.measurements!.results.length - 1 ? `24px` : `18px`

        el.addEventListener("click", () => {
          this.popup.addPopup(this.map, m)
        })

        const coordinates: [number, number] = [m.long, m.lat]

        features.push(coordinates)

        return new Marker({ element: el })
          .setLngLat(coordinates)
          .addTo(this.map)
      })
      const line = lineString(features)
      const box = bbox(line) as [number, number, number, number]
      // this.map.fitBounds(box, {
      //   padding: { top: 12, bottom: 12, left: 12, right: 12 },
      // })
    }
  }

  private getIconByClass(classification?: number) {
    switch (classification) {
      case 1:
        return `/assets/images/map-icon-red.svg`
      case 2:
        return `/assets/images/map-icon-yellow.svg`
      case 3:
        return `/assets/images/map-icon-green.svg`
      case 4:
        return `/assets/images/map-icon-deep-green.svg`
      default:
        return ""
    }
  }
}
