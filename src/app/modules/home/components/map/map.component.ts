import { AfterViewInit, Component, Input, OnDestroy } from "@angular/core"
import { IRecentMeasurementsResponse } from "../../interfaces/recent-measurements-response.interface"
import {
  catchError,
  debounceTime,
  fromEvent,
  of,
  Subject,
  Subscription,
  takeUntil,
  tap,
} from "rxjs"
import { Map } from "maplibre-gl"

const style = {
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
export class MapComponent implements AfterViewInit, OnDestroy {
  @Input({ required: true }) measurements: IRecentMeasurementsResponse | null =
    null
  @Input() mapContainerId?: string
  destroyed$ = new Subject<void>()
  mapId = "map"
  map!: Map
  resizeSub!: Subscription

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
      center: [1, 15],
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
    console.log(containerWidth)
    document
      .getElementById(this.mapId)!
      .setAttribute("style", `height:440px;width:${containerWidth - 24}px`)
  }
}
