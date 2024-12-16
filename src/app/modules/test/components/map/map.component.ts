import { AfterViewInit, Component, Input, NgZone } from "@angular/core"
import { Subject, Subscription } from "rxjs"
import {
  DEFAULT_CENTER,
  DEFAULT_STYLE,
  MapService,
} from "../../../map/services/map.service"
import { Map, NavigationControl } from "maplibre-gl"

@Component({
  selector: "app-map",
  standalone: true,
  imports: [],
  templateUrl: "./map.component.html",
  styleUrl: "./map.component.scss",
})
export class MapComponent implements AfterViewInit {
  @Input({ required: true }) params!: URLSearchParams
  @Input({ required: true }) mapContainerId!: string
  destroyed$ = new Subject<void>()
  mapId = "map"
  map!: Map
  resizeSub!: Subscription

  constructor(
    private readonly mapService: MapService,
    private readonly zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    if (globalThis.document) {
      this.setSize()
      this.setResizeSub()
      this.setMap()
      this.mapService.setCoordinatesAndZoom(this.map, this.params)
      this.addMarker()
    }
  }

  private setResizeSub() {
    this.resizeSub = this.mapService.getResizeSub(this.map, {
      takeUntil: this.destroyed$,
      onResize: () => this.setSize(),
    })
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
        .setAttribute("style", `height:350px;width:${containerWidth}px`)
    })
  }

  private setMap() {
    this.zone.runOutsideAngular(async () => {
      this.map = new Map({
        container: this.mapId,
        style: DEFAULT_STYLE,
        center: DEFAULT_CENTER,
        zoom: 6,
      })
      this.map.addControl(new NavigationControl())
    })
  }

  private addMarker() {
    this.zone.runOutsideAngular(() => {
      const lon = this.params.get("lon")
      const lat = this.params.get("lat")
      if (!lon && !lat) {
        return
      }
      this.mapService.addMarker(this.map, {
        lon: parseFloat(lon!),
        lat: parseFloat(lat!),
        diameter: 24,
      })
    })
  }
}
