import { Component, computed, input } from "@angular/core"
import { Subject, Subscription, takeUntil } from "rxjs"
import { IFenceItem } from "../../interfaces/open-test-response"
import { Map, NavigationControl } from "maplibre-gl"
import { DEFAULT_CENTER, MapService } from "../../../map/services/map.service"

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

  constructor(private readonly mapService: MapService) {}

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
        style: this.mapService.getLineStyle(this.path()),
        center: DEFAULT_CENTER,
      })
      .pipe(takeUntil(this.destroyed$))
      .subscribe((map) => {
        this.map = map
        this.map.addControl(new NavigationControl())
        this.map.on("load", () => {
          this.addPath()
        })
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
        "line-color": "#863876",
        "line-width": 2,
      },
      pointPaint: {
        "circle-color": "#863876",
        "circle-radius": 6,
      },
    })
    this.mapService.fitBounds(this.map, this.path())
  }
}
