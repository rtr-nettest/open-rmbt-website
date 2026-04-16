import { Component, computed, inject, input } from "@angular/core"
import { Subject, Subscription, takeUntil } from "rxjs"
import { IFenceItem } from "../../interfaces/open-test-response"
import { Map, NavigationControl } from "maplibre-gl"
import { DEFAULT_CENTER, MapService } from "../../../map/services/map.service"
import { MobileNetworkColorMap } from "../../constants/network-technology"
import { PopupService } from "../../../map/services/popup.service"
import { FencesPopupContentService } from "../../services/fences-popup-content.service"

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
  lat = computed(() => {
    const lat = this.params().get("lat")
    return lat ? +lat : null
  })
  lon = computed(() => {
    const lon = this.params().get("long")
    return lon ? +lon : null
  })
  accuracy = computed(() => {
    const acc = this.params().get("loc_accuracy")
    return acc ? +acc : null
  })
  pathMarkers: maplibregl.Marker[] = []

  mapService = inject(MapService)
  popup = inject(PopupService)
  popupContent = inject(FencesPopupContentService)

  ngAfterViewInit(): void {
    if (globalThis.document) {
      this.setSize()
      this.setMap()
      this.setResizeSub()
      this.addMarker()
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

  private addMarker() {
    this.mapService.addMarker(this.map, {
      lon: this.lon(),
      lat: this.lat(),
      diameter: 24,
      zIndex: 1,
    })
  }

  private addPath() {
    if (!this.map) {
      return
    }
    if (this.path().length < 2) {
      return
    }
    this.pathMarkers = this.mapService.addPathMarkers(this.map, this.path())
    this.mapService.addLineLayer(this.map, {
      linePaint: {
        "line-opacity": 0,
      },
      pointPaint: {
        "circle-color": [
          "match",
          ["get", "technology_id"],
          ...[...MobileNetworkColorMap.entries()].flat(),
          "#d9d9d9",
        ] as any,
        "circle-radius": 6,
      },
    })
    this.mapService.fitBounds(this.map, this.path())
  }
}
