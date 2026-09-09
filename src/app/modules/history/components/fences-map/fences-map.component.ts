import { Component, computed, effect, inject, input } from "@angular/core"
import { Subject, Subscription, takeUntil } from "rxjs"
import { IFenceItem } from "../../interfaces/open-test-response"
import { Map, Marker, NavigationControl } from "maplibre-gl"
import { DEFAULT_CENTER, MapService } from "../../../map/services/map.service"
import {
  MobileNetworkColorMap,
  EMNTechColor,
} from "../../constants/network-technology"
import { PopupService } from "../../../map/services/popup.service"
import { FencesPopupContentService } from "../../services/fences-popup-content.service"
import { THRESHOLD_PING } from "../../../shared/services/classification.service"

const MIN_SIGNAL = -125
const MAX_SIGNAL = -85
const MAP_CONTAINER_HEIGHT_PX = 420
// Worst still-acceptable average ping (ms) for a fence to count as covered
// in "technology only" mode, where no signal value is available.
// NB: ClassificationService.classify() sorts THRESHOLD_PING in place, so the
// array order is not reliable here — take the max explicitly.
const ACCEPTABLE_PING_MS = Math.max(...THRESHOLD_PING)
const POINTS_LAYER_ID = "route-points"

@Component({
  selector: "app-fences-map",
  imports: [],
  templateUrl: "./fences-map.component.html",
  styleUrl: "./fences-map.component.scss",
})
export class FencesMapComponent {
  destroyed$ = new Subject<void>()
  locations = input.required<IFenceItem[]>()
  selectedFence = input<IFenceItem | null>(null)
  // "Technology only": colour points by technology + acceptable ping
  // (full colour if covered, grey otherwise) instead of by signal strength.
  technologyOnly = input<boolean>(false)
  path = computed(() =>
    this.locations().map(
      (loc) => [loc.longitude, loc.latitude] as [number, number],
    ),
  )
  mapContainerId = input.required<string>()
  mapId = "fencesMap"
  map!: Map
  params = input.required<URLSearchParams>()
  resizeSub!: Subscription
  pathMarkers: Marker[] = []

  mapService = inject(MapService)
  popup = inject(PopupService)
  popupContent = inject(FencesPopupContentService)

  constructor() {
    effect(() => {
      const fence = this.selectedFence()
      if (this.map && fence) {
        this.focusFence(fence)
      }
    })
    effect(() => {
      // React to the "Technology only" toggle without rebuilding the map.
      const circleColor = this.getCircleColor(this.technologyOnly())
      if (this.map?.getLayer(POINTS_LAYER_ID)) {
        this.map.setPaintProperty(POINTS_LAYER_ID, "circle-color", circleColor)
      }
    })
  }

  ngAfterViewInit(): void {
    if (globalThis.document) {
      this.setSize()
      this.setMap()
      this.setResizeSub()
      this.mapService.setCoordinatesAndZoom(this.map, this.params())
    }
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
      .setAttribute("style", `height:${MAP_CONTAINER_HEIGHT_PX}px;width:100%`)
  }

  private setMap() {
    this.mapService
      .createMap({
        container: this.mapId,
        style: this.mapService.getLineStyle(this.path(), this.locations()),
        center: DEFAULT_CENTER,
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe((map) => {
        this.map = map
        this.map.addControl(new NavigationControl())
        this.map.on("load", () => {
          this.addPath()
          this.focusFence(this.selectedFence())
        })
        this.map.on("click", (e) => {
          const features = this.map.queryRenderedFeatures(e.point, {
            layers: ["route-points"],
          })
          const fencesAtPoint = features.map((f) => f.properties as IFenceItem)
          if (fencesAtPoint.length) {
            this.popup.addPopup(this.map, fencesAtPoint, this.popupContent, {
              lon: e.lngLat.lng,
              lat: e.lngLat.lat,
            })
          }
        })
      })
  }

  private focusFence(fence: IFenceItem | null) {
    if (!this.map || !fence) {
      return
    }

    const latitude = Number(fence.latitude)
    const longitude = Number(fence.longitude)
    if (Number.isNaN(latitude) || Number.isNaN(longitude)) {
      return
    }

    this.popup.removePopup()
    this.map.flyTo({ center: [longitude, latitude], zoom: 14, essential: true })
    this.popup.addPopup(this.map, [fence], this.popupContent, {
      lon: longitude,
      lat: latitude,
    })
  }

  private addPath() {
    if (!this.map) {
      return
    }
    if (this.path().length < 1) {
      return
    }
    this.pathMarkers = this.mapService.addPathMarkers(this.map, this.path())
    this.mapService.addLineLayer(this.map, {
      linePaint: {
        "line-opacity": 0,
      },
      pointPaint: {
        "circle-color": this.getCircleColor(this.technologyOnly()),
        "circle-radius": 6,
      },
    })
    this.mapService.fitBounds(this.map, this.path())
  }

  private getCircleColor(technologyOnly: boolean): any {
    const technologyMatch = [
      "match",
      ["get", "technology_id"],
      ...[...MobileNetworkColorMap.entries()].flatMap(
        ([technologyId, networkColor]) => [
          technologyId,
          technologyOnly
            ? // No signal available: use the full technology colour.
              networkColor
            : // Fade the technology colour towards grey by signal strength.
              [
                "interpolate",
                ["linear"],
                ["get", "signal"],
                MIN_SIGNAL,
                EMNTechColor.T_OFFLINE,
                MAX_SIGNAL,
                networkColor,
              ],
        ],
      ),
      EMNTechColor.T_OFFLINE,
    ]
    // Grey ("offline") when there is no coverage: no ping (or no acceptable
    // ping) or no technology. Android additionally requires a signal value.
    const offlineConditions: any[] = [
      "any",
      ["==", ["get", "avg_ping_ms"], null],
      technologyOnly
        ? [">", ["get", "avg_ping_ms"], ACCEPTABLE_PING_MS]
        : ["==", ["get", "signal"], null],
    ]
    return ["case", offlineConditions, EMNTechColor.T_OFFLINE, technologyMatch]
  }
}
