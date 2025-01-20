import { HttpClient } from "@angular/common/http"
import { Injectable, NgZone } from "@angular/core"
import { I18nStore } from "../../i18n/store/i18n.store"
import { IMapInfo } from "../interfaces/map-info.interface"
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
import { UUID } from "../../test/constants/strings"
import { MainStore } from "../../shared/store/main.store"
import { EBasemapType } from "../constants/basemap-type.enum"
import { ETileTypes } from "../constants/tile-type.enum"
import { BASEMAP_STYLE, DEFAULT_STYLE } from "../constants/map-styles"
import { NetworkMeasurementType } from "../constants/network-measurement-type"

export const DEFAULT_CENTER: [number, number] = [
  13.786457000803567, 47.57838319858735,
]

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
    return `${this.mainStore.api().url_map_server}/tiles`
  }

  constructor(
    private readonly http: HttpClient,
    private readonly i18nStore: I18nStore,
    private readonly mainStore: MainStore,
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

  switchBasemap(map: Map, layerId: string) {
    if (!map) {
      return
    }
    map.setLayoutProperty(EBasemapType.BMAPGRAU, "visibility", "none")
    const currentLayer = map.getLayer(layerId)
    if (currentLayer) {
      for (const layer of Object.values(BASEMAP_STYLE.layers)) {
        if (layer.id !== layerId) {
          map.setLayoutProperty(layer.id, "visibility", "none")
        }
      }
      map.setLayoutProperty(layerId, "visibility", "visible")
    }
  }

  getAllBasemapAtStyles() {
    return of({
      ...DEFAULT_STYLE,
      sources: {
        ...DEFAULT_STYLE.sources,
        ...BASEMAP_STYLE.sources,
      },
      layers: [...DEFAULT_STYLE.layers, ...BASEMAP_STYLE.layers],
    })
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
