import { HttpClient } from "@angular/common/http"
import { Injectable, NgZone } from "@angular/core"
import { environment } from "../../../../environments/environment"
import { NetworkMeasurementType } from "../interfaces/map-type.interface"
import { I18nStore } from "../../i18n/store/i18n.store"
import { IMapInfo } from "../interfaces/map-info.interface"
import { UUID } from "../../shared/constants/strings"
import { Map, Marker, StyleSpecification } from "maplibre-gl"
import {
  catchError,
  debounceTime,
  fromEvent,
  map,
  of,
  Subject,
  takeUntil,
  tap,
} from "rxjs"

export const DEFAULT_CENTER: [number, number] = [
  13.786457000803567, 47.57838319858735,
]
export const DEFAULT_STYLE: StyleSpecification = {
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
export const BASEMAP_AT_STYLE =
  "https://mapsneu.wien.gv.at/basemapvectorneu/root.json"

export enum ETileTypes {
  automatic = "automatic",
  heatmap = "heatmap",
  points = "points",
  cadastral = "cadastral",
}

export type MapSourceOptions = Partial<{
  networkMeasurementType: NetworkMeasurementType | null
  tiles: ETileTypes | null
  filters: Partial<{
    statistical_method: string | null
    period: number | null
    provider: string | null
    operator: string | null
    technology: string | null
  }>
}>

@Injectable({
  providedIn: "root",
})
export class MapService {
  get tileServer() {
    return `${environment.api.cloud}/RMBTMapServer/tiles`
  }

  constructor(
    private readonly http: HttpClient,
    private readonly i18nStore: I18nStore,
    private readonly zone: NgZone
  ) {}

  createMap(options: {
    container: string
    style: StyleSpecification
    center?: [number, number]
    zoom?: number
  }) {
    return new Map({
      ...options,
      transformRequest: (url) => {
        // The Basemap vector style uses relative URLs, which are not supported by Mabox standard
        if (url.startsWith("tile")) {
          return {
            // from https://github.com/trafficon/basemap-at-maplibre/blob/40e36cda1f55e03d8698d5d658037cc2a15c3484/basemapv-bmapv-3857.json#L8
            url: `https://mapsneu.wien.gv.at/basemapv/bmapv/3857/${url}`,
          }
        }
        return {
          url,
        }
      },
    })
  }

  getBasemapAtStyle() {
    return this.http.get<StyleSpecification>(BASEMAP_AT_STYLE).pipe(
      map((style) => {
        style.sources["osm"] = DEFAULT_STYLE.sources["osm"]
        if (style.sources["esri"]) {
          ;(style.sources["esri"] as any)["attribution"] =
            "&copy; <a href='https://basemap.at' target='_blank'>basemap.at</a>"
        }
        style.layers.unshift(DEFAULT_STYLE.layers[0])
        return style
      })
    )
  }

  getFilters() {
    const body: { [key: string]: any } = {
      version_name: "0.1",
      language: this.i18nStore.activeLang,
      type: "DESKTOP",
      version_code: "1",
      name: "RTR-Netztest",
      open_test_uuid: null,
    }
    if (globalThis.localStorage) {
      const uuid = localStorage.getItem(UUID)
      if (uuid) {
        body["uuid"] = uuid
        body["terms_and_conditions_accepted"] = true
      }
    }
    return this.http.post<IMapInfo>(`${this.tileServer}/info`, body)
  }

  getPointSource(options: MapSourceOptions) {
    return this.getSource("/points/{z}/{x}/{y}.png", options)
  }

  getHeatmapSource(options: MapSourceOptions) {
    return this.getSource("/heatmap/{z}/{x}/{y}.png", options)
  }

  getShapeSource(options: MapSourceOptions) {
    return this.getSource("/shapes/{z}/{x}/{y}.png", options)
  }

  private getSource(path: string, options: MapSourceOptions) {
    const { networkMeasurementType, filters } = options
    let retVal = `${this.tileServer}${path}?null&map_options=${networkMeasurementType}`
    if (filters) {
      for (const [key, val] of Object.entries(filters)) {
        if (val) {
          retVal += `&${key}=${val}`
        }
      }
    }
    return retVal
  }

  getResizeSub(
    map: Map,
    options: {
      takeUntil: Subject<void>
      onResize: () => any
    }
  ) {
    return fromEvent(window, "resize")
      .pipe(
        takeUntil(options.takeUntil),
        debounceTime(300),
        tap(() => options.onResize()),
        tap(() => {
          setTimeout(() => {
            this.zone.runOutsideAngular(() => map.resize())
          }, 300)
        }),
        catchError((err) => {
          console.log(err)
          return of(err)
        })
      )
      .subscribe()
  }

  setCoordinatesAndZoom(map: Map, params: URLSearchParams) {
    this.zone.runOutsideAngular(() => {
      if (params.has("accuracy")) {
        let zoom = 11
        const accuracy = parseInt(params.get("accuracy")!)
        const distance = params.get("distance")!
        if (accuracy !== null) {
          let totalAccuracy =
            accuracy + (distance !== null ? parseInt(distance) : 0)
          if (totalAccuracy < 100) {
            zoom = 17
          } else if (totalAccuracy < 1000) {
            zoom = 13
          }
        }
        map.setZoom(zoom)
      }
      if (params.has("lat") && params.has("lon")) {
        map.setCenter([
          parseFloat(params.get("lon")!),
          parseFloat(params.get("lat")!),
        ])
      }
    })
  }

  addMarker(
    map: Map,
    options: {
      lon: number
      lat: number
      diameter: number
      classification?: number
      onClick?: () => any
    }
  ) {
    const { lon, lat, diameter, classification, onClick } = options
    const el = document.createElement("div")
    el.className = "app-marker"
    el.style.backgroundImage = `url(${this.getIconByClass(classification)})`
    el.style.width = `${diameter}px`
    el.style.height = `${diameter}px`
    if (onClick) {
      el.addEventListener("click", () => {
        onClick()
      })
    }
    return new Marker({ element: el }).setLngLat([lon, lat]).addTo(map)
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
        return `/assets/images/map-icon-blue.svg`
    }
  }
}
