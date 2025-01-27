import { HttpClient } from "@angular/common/http"
import { computed, Injectable, NgZone } from "@angular/core"
import { I18nStore } from "../../i18n/store/i18n.store"
import { IMapInfo } from "../interfaces/map-info.interface"
import { Map, Marker, StyleSpecification } from "maplibre-gl"
import {
  catchError,
  debounceTime,
  fromEvent,
  of,
  Subject,
  takeUntil,
  tap,
} from "rxjs"
import { UUID } from "../../test/constants/strings"
import { MainStore } from "../../shared/store/main.store"
import { EBasemapType } from "../constants/basemap-type.enum"
import { ETileTypes } from "../constants/tile-type.enum"
import { BASE_SOURCE } from "../constants/map-styles"
import { NetworkMeasurementType } from "../constants/network-measurement-type"

export const DEFAULT_CENTER: [number, number] = [
  13.786457000803567, 47.57838319858735,
]

export type MapSourceOptions = Partial<{
  networkMeasurementType: NetworkMeasurementType | null
  tiles: ETileTypes | null
  filters: Partial<{
    statistical_method: number | null
    period: number | null
    provider: string | number | null
    operator: string | number | null
    technology: string | null
  }>
}>

@Injectable({
  providedIn: "root",
})
export class MapService {
  defaultStyle = computed<StyleSpecification>(() => {
    if (
      !this.mainStore.api().url_web_osm_tiles ||
      !this.mainStore.api().url_web_basemap_tiles
    ) {
      return {
        version: 8 as const,
        sources: {},
        layers: [],
      }
    }
    const sources = {
      [EBasemapType.OSM]: {
        ...BASE_SOURCE,
        tiles: [this.mainStore.api().url_web_osm_tiles!],
        attribution: "&copy; OpenStreetMap Contributors",
      },
      [EBasemapType.BMAPGRAU]: {
        ...BASE_SOURCE,
        tiles: [this.getTilesByType(EBasemapType.BMAPGRAU)!],
      },
    }
    return {
      version: 8 as const,
      sources,
      layers: this.getLayersFromSources(sources),
    }
  })
  basemapAtStyle = computed<StyleSpecification>(() => {
    if (!this.mainStore.api().url_web_basemap_tiles) {
      return {
        version: 8 as const,
        sources: {},
        layers: [],
      }
    }
    const sources = {
      [EBasemapType.BMAPOVERLAY]: {
        ...BASE_SOURCE,
        tiles: [this.getTilesByType(EBasemapType.BMAPOVERLAY)!],
      },
      [EBasemapType.BMAPORTHO]: {
        ...BASE_SOURCE,
        tiles: [this.getTilesByType(EBasemapType.BMAPORTHO)!],
      },
      [EBasemapType.BMAPHDPI]: {
        ...BASE_SOURCE,
        tiles: [this.getTilesByType(EBasemapType.BMAPHDPI)!],
      },
    }
    return {
      version: 8 as const,
      sources,
      layers: this.getLayersFromSources(sources),
    }
  })
  fullStyle = computed<StyleSpecification>(() => {
    const defaultStyle = this.defaultStyle()
    const basemapAtStyle = this.basemapAtStyle()
    if (!defaultStyle.layers.length || !basemapAtStyle.layers.length) {
      return {
        version: 8 as const,
        sources: {},
        layers: [],
      }
    }
    return {
      ...defaultStyle,
      sources: {
        ...defaultStyle.sources,
        ...basemapAtStyle.sources,
      },
      layers: [...defaultStyle.layers, ...basemapAtStyle.layers],
    }
  })

  private get tileServer() {
    return `${this.mainStore.api().url_map_server}/tiles`
  }
  private get tileServerV2() {
    return `${this.mainStore.api().url_map_server}/v2/tiles`
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
    return new Map(options)
  }

  switchBasemap(map: Map, layerId: string) {
    if (!map) {
      return
    }
    map.setLayoutProperty(EBasemapType.BMAPGRAU, "visibility", "none")
    const currentLayer = map.getLayer(layerId)
    const basemapAtStyle = this.basemapAtStyle()
    if (currentLayer && basemapAtStyle) {
      for (const layer of Object.values(basemapAtStyle.layers)) {
        if (layer.id !== layerId) {
          map.setLayoutProperty(layer.id, "visibility", "none")
        }
      }
      map.setLayoutProperty(layerId, "visibility", "visible")
    }
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
    return this.http.post<IMapInfo>(`${this.tileServerV2}/info`, body)
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

  private getTilesByType(type: EBasemapType) {
    return this.mainStore.api().url_web_basemap_tiles?.replace("{type}", type)
  }

  private getLayersFromSources(sources: { [key: string]: any }) {
    return Object.keys(sources).map((key) => ({
      id: key,
      type: "raster" as const,
      source: key,
    }))
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
