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
import { IRecentMeasurementsResponse } from "../../interfaces/recent-measurements-response.interface"
import { Subject, Subscription } from "rxjs"
import { Marker, Map, NavigationControl, FullscreenControl } from "maplibre-gl"
import { bbox } from "@turf/bbox"
import { lineString } from "@turf/helpers"
import { PopupService } from "../../services/popup.service"
import { FullScreenService } from "../../services/full-screen.service"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { DEFAULT_CENTER, MapService } from "../../../map/services/map.service"
import { DEFAULT_STYLE } from "../../../map/constants/map-styles"

@Component({
  selector: "app-map",
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: "./map.component.html",
  styleUrl: "./map.component.scss",
})
export class MapComponent implements AfterViewInit, OnDestroy, OnChanges {
  @Input({ required: true }) measurements: IRecentMeasurementsResponse | null =
    null
  @Input() mapContainerId?: string
  cachedMarkers: Marker[] = []
  destroyed$ = new Subject<void>()
  fullScreen = inject(FullScreenService)
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
    this.map?.off("resize", this.showStats)
  }

  ngAfterViewInit(): void {
    if (globalThis.document) {
      this.setSize()
      this.setMap().then(() => {
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
      this.map = this.mapService.createMap({
        container: this.mapId,
        style: DEFAULT_STYLE,
        center: DEFAULT_CENTER,
        zoom: 3,
      })
      this.map.addControl(new NavigationControl())
      this.map.addControl(new FullscreenControl())
      this.map.on("resize", this.showStats)
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
      if (this.measurements?.results?.length) {
        this.cachedMarkers.forEach((m) => m.remove())
        const features: [number, number][] = []
        this.cachedMarkers = this.measurements.results.reverse().map((m, i) => {
          const coordinates: [number, number] = [m.long, m.lat]
          features.push(coordinates)
          return this.mapService.addMarker(this.map, {
            lon: m.long,
            lat: m.lat,
            diameter: i == this.measurements!.results.length - 1 ? 24 : 18,
            classification: m.download_classification,
            onClick: () => {
              this.popup.addPopup(this.map, m)
            },
          })
        })
        const line = lineString(features)
        const box = bbox(line) as [number, number, number, number]
        this.map.fitBounds(box, {
          padding: { top: 12, bottom: 12, left: 12, right: 12 },
        })
      }
    })
  }
}
