import {
  AfterViewInit,
  Component,
  inject,
  Input,
  NgZone,
  OnChanges,
  OnDestroy,
  SimpleChanges,
} from "@angular/core"
import { IRecentMeasurement } from "../../../opendata/interfaces/recent-measurements-response.interface"
import { Subject, Subscription, takeUntil } from "rxjs"
import { Marker, Map, NavigationControl, IControl } from "maplibre-gl"
import { bbox } from "@turf/bbox"
import { lineString } from "@turf/helpers"
import { PopupService } from "../../services/popup.service"
import { FullScreenService } from "../../services/full-screen.service"
import { DEFAULT_CENTER, MapService } from "../../services/map.service"

@Component({
  selector: "app-map",
  templateUrl: "./map.component.html",
  styleUrl: "./map.component.scss",
})
export class MapComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input({ required: true }) measurements: IRecentMeasurement[] = []
  @Input({ required: true }) mapContainerId!: string
  @Input() controls: IControl[] = [new NavigationControl()]
  cachedMarkers: Marker[] = []
  destroyed$ = new Subject<void>()
  fullScreen = inject(FullScreenService)
  lastPopupLonLat: [number, number] | null = null
  mapId = "map"
  map!: Map
  mapService = inject(MapService)
  popup = inject(PopupService)
  resizeSub!: Subscription
  zone = inject(NgZone)

  ngOnChanges(changes: SimpleChanges): void {
    if ("measurements" in changes && this.map) {
      this.setMeasurements()
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
    globalThis?.document.removeEventListener("fullscreenchange", this.showStats)
  }

  ngAfterViewInit(): void {
    if (globalThis.document) {
      this.setSize()
      this.setMap().then(() => {
        this.setMeasurements()
        this.setResizeSub()
      })
    }
  }

  private showStats = () => {
    this.zone.runOutsideAngular(() => {
      if (document.fullscreenElement) {
        this.fullScreen.addPopup()
      } else {
        this.fullScreen.removePopup()
      }
    })
  }

  private async setMap() {
    this.zone.runOutsideAngular(() => {
      this.mapService
        .createMap({
          container: this.mapId,
          style: this.mapService.defaultStyle(),
          center: DEFAULT_CENTER,
          zoom: 3,
        })
        .pipe(takeUntil(this.destroyed$))
        .subscribe((map) => {
          this.map = map
          for (const control of this.controls) {
            this.map.addControl(control)
          }
        })
      globalThis?.document.addEventListener("fullscreenchange", this.showStats)
    })
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
      document
        .getElementById(this.mapId)!
        .setAttribute("style", `height:440px;width:100%`)
    })
  }

  private setMeasurements() {
    this.zone.runOutsideAngular(() => {
      if (this.measurements.length) {
        this.cachedMarkers.forEach((m) => m.remove())
        const features: [number, number][] = []
        const cachedMarkers = [...this.measurements].filter(
          (m) => m.lat && m.long,
        )
        this.cachedMarkers = cachedMarkers.map((m, i) => {
          const coordinates: [number, number] = [m.long, m.lat]
          features.push(coordinates)
          if (
            document.fullscreenElement &&
            i == 0 &&
            (m.long != this.lastPopupLonLat?.[0] ||
              m.lat != this.lastPopupLonLat?.[1])
          ) {
            this.popup.removePopup()
            this.popup.addPopup(this.map, [m])
          }
          if (i == 0) {
            this.lastPopupLonLat = [m.long, m.lat]
          }
          return this.mapService.addMarker(this.map, {
            lon: m.long,
            lat: m.lat,
            diameter: i == 0 ? 24 : 18,
            classification: m.download_classification,
            onClick: () => {
              this.popup.addPopup(this.map, [m])
            },
          })
        })
        if (features.length > 1) {
          const line = lineString(features)
          const box = bbox(line) as [number, number, number, number]
          this.map.fitBounds(box, {
            padding: { top: 12, bottom: 12, left: 12, right: 12 },
            maxZoom: 12,
          })
        }
      }
    })
  }
}
