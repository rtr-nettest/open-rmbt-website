import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  Input,
  NgZone,
} from "@angular/core"
import { firstValueFrom, Subject, Subscription } from "rxjs"
import { DEFAULT_CENTER, MapService } from "../../../map/services/map.service"
import { Map, NavigationControl } from "maplibre-gl"
import { MatButtonModule } from "@angular/material/button"
import { MatDialog } from "@angular/material/dialog"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { ScrollStrategyOptions } from "@angular/cdk/overlay"
import { CoverageDialogComponent } from "../coverage-dialog/coverage-dialog.component"

@Component({
  selector: "app-map",
  standalone: true,
  imports: [MatButtonModule, TranslatePipe],
  templateUrl: "./map.component.html",
  styleUrl: "./map.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MapComponent implements AfterViewInit {
  @Input({ required: true }) params!: URLSearchParams
  @Input({ required: true }) mapContainerId!: string
  destroyed$ = new Subject<void>()
  mapId = "map"
  map!: Map
  resizeSub!: Subscription

  get href() {
    const search = [
      `lat=${this.params.get("lat")}`,
      `lon=${this.params.get("lon")}`,
      `radius=700`,
      `accuracy=<700`,
    ]
    return `/${this.i18nStore.activeLang}/${ERoutes.OPEN_DATA}?${search.join(
      "&"
    )}`
  }

  constructor(
    private readonly dialog: MatDialog,
    private readonly i18nStore: I18nStore,
    private readonly mapService: MapService,
    private readonly scrollStrategyOptions: ScrollStrategyOptions,
    private readonly zone: NgZone
  ) {}

  ngAfterViewInit(): void {
    if (globalThis.document) {
      this.setSize()
      this.setMap().then(() => {
        this.setResizeSub()
        this.mapService.setCoordinatesAndZoom(this.map, this.params)
        this.addMarker()
      })
    }
  }

  showCoverageDialog() {
    this.dialog.open(CoverageDialogComponent, {
      data: this.params,
      panelClass: "app-coverage-dialog",
      scrollStrategy: this.scrollStrategyOptions.noop(),
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
      let containerWidth = document
        .getElementById(this.mapContainerId)!
        .getBoundingClientRect().width
      document
        .getElementById(this.mapId)!
        .setAttribute("style", `height:350px;width:${containerWidth}px`)
    })
  }

  private async setMap() {
    const style = await firstValueFrom(this.mapService.getBasemapAtStyle())
    this.zone.runOutsideAngular(() => {
      this.map = this.mapService.createMap({
        container: this.mapId,
        style: style,
        center: DEFAULT_CENTER,
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
