import { Component, computed, inject, input } from "@angular/core"
import { Subject, Subscription, takeUntil } from "rxjs"
import { IFenceItem } from "../../interfaces/open-test-response"
import { Map, NavigationControl } from "maplibre-gl"
import { DEFAULT_CENTER, MapService } from "../../../map/services/map.service"
import {
  MobileNetworkColorMap,
  EMNTechColor,
} from "../../constants/network-technology"
import { PopupService } from "../../../map/services/popup.service"
import { FencesPopupContentService } from "../../services/fences-popup-content.service"

const MIN_SIGNAL = -125
const MAX_SIGNAL = -85

@Component({
  selector: "app-fences-map",
  imports: [],
  templateUrl: "./fences-map.component.html",
  styleUrl: "./fences-map.component.scss",
})
export class FencesMapComponent {
  destroyed$ = new Subject<void>()
  locations = input.required<IFenceItem[]>()
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
  pathMarkers: maplibregl.Marker[] = []

  mapService = inject(MapService)
  popup = inject(PopupService)
  popupContent = inject(FencesPopupContentService)

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
      .setAttribute("style", `height:350px;width:100%`)
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
        "circle-color": [
          "case",
          [
            "any",
            ["==", ["get", "avg_ping_ms"], null],
            ["==", ["get", "signal"], null],
          ],
          EMNTechColor.T_OFFLINE,
          [
            "match",
            ["get", "technology_id"],
            ...[...MobileNetworkColorMap.entries()].flatMap(
              ([technologyId, networkColor]) => [
                technologyId,
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
          ],
        ] as any,
        "circle-radius": 6,
      },
    })
    this.mapService.fitBounds(this.map, this.path())
  }
}
