import { HttpClient } from "@angular/common/http"
import { computed, Injectable, NgZone } from "@angular/core"
import { I18nStore } from "../../i18n/store/i18n.store"
import { IMapInfo } from "../interfaces/map-info.interface"
import { Map, MapOptions, Marker, StyleSpecification } from "maplibre-gl"
import {
  catchError,
  debounceTime,
  fromEvent,
  map,
  Observable,
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
import { IMarkerRequest } from "../interfaces/marker-request.interface"
import { IMarkerResponse } from "../interfaces/marker-response.interface"
import { IRecentMeasurement } from "../../opendata/interfaces/recent-measurements-response.interface"
import { formatTime } from "../../shared/adapters/app-date.adapter"
import { Coordinate } from "ol/coordinate"
import { lineString } from "@turf/helpers"
import bbox from "@turf/bbox"
import drawCircle from "@turf/circle"

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

const DUMMY_STYLE = {
  version: 8 as const,
  sources: {},
  layers: [],
}

declare const maplibregl: any

@Injectable({
  providedIn: "root",
})
export class MapService {
  defaultStyle = computed<StyleSpecification>(() => {
    if (
      !this.mainStore.api().url_web_osm_tiles ||
      !this.mainStore.api().url_web_basemap_tiles
    ) {
      return DUMMY_STYLE
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
  basemapAtHdpiStyle = computed<StyleSpecification>(() => {
    if (!this.mainStore.api().url_web_basemap_tiles) {
      return DUMMY_STYLE
    }
    const sources = {
      [EBasemapType.BMAPHDPI]: {
        ...BASE_SOURCE,
        tiles: [this.getTilesByType(EBasemapType.BMAPHDPI, "jpeg")!],
      },
    }
    return {
      version: 8 as const,
      sources,
      layers: this.getLayersFromSources(sources),
    }
  })
  basemapAtOrthoStyle = computed<StyleSpecification>(() => {
    if (!this.mainStore.api().url_web_basemap_tiles) {
      return DUMMY_STYLE
    }
    const sources = {
      [EBasemapType.BMAPORTHO]: {
        ...BASE_SOURCE,
        tiles: [this.getTilesByType(EBasemapType.BMAPORTHO, "jpeg")!],
      },
    }
    return {
      version: 8 as const,
      sources,
      layers: this.getLayersFromSources(sources),
    }
  })
  basemapAtOverlayStyle = computed<StyleSpecification>(() => {
    if (
      !this.mainStore.api().url_web_osm_tiles ||
      !this.mainStore.api().url_web_basemap_tiles
    ) {
      return DUMMY_STYLE
    }
    const sources = {
      [EBasemapType.OSM]: {
        ...BASE_SOURCE,
        tiles: [this.mainStore.api().url_web_osm_tiles!],
        attribution: "&copy; OpenStreetMap Contributors",
      },
      [EBasemapType.BMAPOVERLAY]: {
        ...BASE_SOURCE,
        tiles: [this.getTilesByType(EBasemapType.BMAPOVERLAY)!],
      },
    }
    return {
      version: 8 as const,
      sources,
      layers: this.getLayersFromSources(sources),
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

  createMap(options: MapOptions) {
    return this.i18nStore.getTranslations().pipe(
      map((translations) => {
        options.locale = translations
        // Using the UMD version of maplibre-gl as the NPM version can not draw the lines on the map
        return new maplibregl.Map(options) as Map
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

  private getTilesByType(type: EBasemapType, ext = "png") {
    return this.mainStore
      .api()
      .url_web_basemap_tiles?.replace("{type}", type)
      .replace(".png", `.${ext}`)
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
      if (params.has("loc_accuracy")) {
        let zoom = 11
        const accuracy = parseInt(params.get("loc_accuracy")!)
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
      if (params.has("lat") && params.has("long")) {
        map.setCenter([
          parseFloat(params.get("long")!),
          parseFloat(params.get("lat")!),
        ])
      }
    })
  }

  fitBounds(map: Map, coordinates: [number, number][]) {
    this.zone.runOutsideAngular(() => {
      if (coordinates.length < 2) {
        return
      }
      const line = lineString(coordinates)
      const box = bbox(line) as [number, number, number, number]
      map.fitBounds(box, {
        animate: false,
        padding: { top: 100, bottom: 100 },
      })
    })
  }

  addMarker(
    map: Map,
    options: {
      lon: number | null
      lat: number | null
      diameter: number
      classification?: number
      rotation?: number
      onClick?: () => any
      zIndex?: number
    }
  ) {
    const { lon, lat, diameter, classification, onClick, rotation, zIndex } =
      options
    if (lon === null || lat === null) {
      return new Marker()
    }
    const el = document.createElement("div")
    el.className = "app-marker"
    el.style.backgroundImage = `url(${this.getIconByClass(classification)})`
    el.style.width = `${diameter}px`
    el.style.height = `${diameter}px`
    if (zIndex) {
      el.style.zIndex = zIndex.toString()
    }
    if (onClick) {
      el.addEventListener("click", () => {
        onClick()
      })
    }
    return new Marker({ element: el, rotation })
      .setLngLat([lon, lat])
      .addTo(map)
  }

  addCircleLayer(map: Map) {
    if (!map) {
      return
    }
    map.addLayer({
      id: `accuracy-circle`,
      type: "fill",
      source: "circle",
      layout: {},
      paint: {
        "fill-color": "#347fbc",
        "fill-opacity": 0.2,
      },
    })
  }

  removeCircleLayer(map: Map) {
    if (!map) {
      return
    }
    map.removeLayer(`accuracy-circle`)
  }

  addPathMarkers(map: Map, coordinates: [number, number][]) {
    if (coordinates.length < 2) {
      return []
    }
    const [currentCoordinate, nextCoordinate] = coordinates.slice(-2)
    let rotation =
      (Math.atan2(
        nextCoordinate[0] - currentCoordinate[0],
        nextCoordinate[1] - currentCoordinate[1]
      ) *
        180) /
      Math.PI
    if (rotation < 0.0) rotation += 360.0
    const markers: Marker[] = []
    for (const [i, loc] of coordinates.entries()) {
      if (loc[0] === null || loc[1] === null) {
        continue
      }
      const marker = this.addMarker(map, {
        lon: loc[0],
        lat: loc[1],
        diameter: i === 0 || i === coordinates.length - 1 ? 24 : 12,
        classification: i === 0 ? 10 : i === coordinates.length - 1 ? 20 : 30,
        rotation,
      })
      markers.push(marker!)
    }
    return markers
  }

  getCircleStyle(options: {
    path: [number, number][]
    lon: number | null
    lat: number | null
    accuracy: number | null
  }) {
    const { lon, lat, accuracy, path } = options
    if (lon === null || lat === null || accuracy === null) {
      return this.getLineStyle(path)
    }
    const radius = accuracy / 500 // in km
    const circle = drawCircle([lon, lat], radius, {
      steps: 64,
      units: "kilometers",
    })
    const base = this.getLineStyle(path)
    return {
      ...base,
      sources: {
        ...base.sources,
        circle: {
          type: "geojson" as const,
          data: circle,
        },
      },
    }
  }

  getLineStyle(coordinates: [number, number][]): StyleSpecification {
    return {
      ...this.defaultStyle(),
      sources: {
        ...this.defaultStyle().sources,
        route: {
          type: "geojson",
          data: {
            type: "Feature",
            properties: {},
            geometry: {
              type: "LineString",
              coordinates,
            },
          },
        },
      },
    }
  }

  addLineLayer(map: Map) {
    if (map.getLayer("route")) {
      return
    }
    map.addLayer({
      id: "route",
      type: "line",
      source: "route",
      layout: {
        "line-join": "round",
        "line-cap": "round",
      },
      paint: {
        "line-color": "#2f2f2f",
        "line-width": 2,
      },
    })
  }

  removeLineLayer(map: Map) {
    if (!map.getLayer("route")) {
      return
    }
    map.removeLayer("route")
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
      case 10:
        return `/assets/images/map-icon-start.svg`
      case 20:
        return `/assets/images/map-icon-finish.svg`
      case 30:
        return `/assets/images/map-icon-black.svg`
      default:
        return `/assets/images/map-icon-blue.svg`
    }
  }

  getMeasurementsAtPoint(
    mapContainer: Map,
    point: Coordinate,
    options: MapSourceOptions = {}
  ): Observable<IRecentMeasurement[]> {
    const uuid = localStorage.getItem(UUID)
    const body: IMarkerRequest = {
      language: this.i18nStore.activeLang,
      coords: {
        x: point[0],
        y: point[1],
        z: mapContainer.getZoom(),
      },
      filter: {
        ...Object.entries(options.filters ?? {}).reduce(
          (acc, [key, val]) => (val !== "" ? { ...acc, [key]: val } : acc),
          {}
        ),
        ...(uuid ? { highlight: uuid } : {}),
      },
      options: {
        map_options: options.networkMeasurementType!,
      },
      capabilities: { classification: { count: 4 } },
    }
    return this.http
      .post<IMarkerResponse>(
        `${this.mainStore.api().url_map_server}/tiles/markers`,
        body
      )
      .pipe(
        map((res) =>
          res.measurements.map((m) =>
            formatTime({
              open_uuid: "",
              open_test_uuid: m.open_test_uuid,
              time: new Date(m.time).toString(),
              lat: m.lat,
              long: m.lon,
              download_classification:
                m.measurement_result.download_classification,
              download_kbit: m.measurement_result.download_kbit!,
              ping_ms: m.measurement_result.ping_ms!,
              upload_kbit: m.measurement_result.upload_kbit!,
              signal_strength: m.measurement_result.signal_strength,
              lte_rsrp: m.measurement_result.lte_rsrp,
              platform: m.network_info.network_type_label,
              provider_name: m.network_info.provider_name,
            })
          )
        )
      )
  }
}
