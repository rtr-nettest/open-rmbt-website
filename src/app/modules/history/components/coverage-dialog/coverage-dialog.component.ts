import {
  AfterViewInit,
  Component,
  Inject,
  NgZone,
  OnDestroy,
} from "@angular/core"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { map, Observable, Subject, Subscription, takeUntil } from "rxjs"
import { HtmlWrapperComponent } from "../../../shared/components/html-wrapper/html-wrapper.component"
import { AsyncPipe } from "@angular/common"
import { TableComponent } from "../../../tables/components/table/table.component"
import { ICoverage } from "../../interfaces/coverage.interface"
import {
  MAT_DIALOG_DATA,
  MatDialog,
  MatDialogModule,
  MatDialogRef,
} from "@angular/material/dialog"
import { IBasicResponse } from "../../../tables/interfaces/basic-response.interface"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { roundToSignificantDigits } from "../../../shared/util/math"
import { ISort } from "../../../tables/interfaces/sort.interface"
import { DEFAULT_CENTER, MapService } from "../../../map/services/map.service"
import { Map, NavigationControl } from "maplibre-gl"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import formatcoords from "formatcoords"
import { LOC_FORMAT } from "../../../shared/pipes/lonlat.pipe"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { lineString } from "@turf/helpers"
import bbox from "@turf/bbox"
import { CloseDialogHeaderComponent } from "../../../shared/components/close-dialog-header/close-dialog-header.component"

@Component({
  selector: "app-coverage-dialog",
  imports: [
    AsyncPipe,
    CloseDialogHeaderComponent,
    HtmlWrapperComponent,
    MatButtonModule,
    MatDialogModule,
    MatIconModule,
    TableComponent,
    TranslatePipe,
  ],
  templateUrl: "./coverage-dialog.component.html",
  styleUrl: "./coverage-dialog.component.scss",
})
export class CoverageDialogComponent implements AfterViewInit, OnDestroy {
  coverageText$!: Observable<string>
  destroyed$ = new Subject<void>()
  mapContainerId = "coverage-map-container"
  mapId = "coverage-map"
  map?: Map
  resizeSub!: Subscription
  sort: ISort = {
    active: "",
    direction: "asc",
  }

  get columns(): ITableColumn<ICoverage>[] {
    return [
      {
        columnDef: "operator",
        header: "Provider",
      },
      {
        columnDef: "technology",
        header: "Technology",
      },
      {
        columnDef: "download_kbit_max",
        header: "DL (max)",
        transformValue: (value) =>
          value.download_kbit_max
            ? `${roundToSignificantDigits(
                value.download_kbit_max / 1000
              )} ${this.i18nStore.translate("Mbps")}`
            : "-",
      },
      {
        columnDef: "upload_kbit_max",
        header: "UL (max)",
        transformValue: (value) =>
          value.upload_kbit_max
            ? `${roundToSignificantDigits(
                value.upload_kbit_max / 1000
              )} ${this.i18nStore.translate("Mbps")}`
            : "-",
      },
      {
        columnDef: "download_kbit_normal",
        header: "DL (normal)",
        transformValue: (value) =>
          value.download_kbit_normal
            ? `${roundToSignificantDigits(
                value.download_kbit_normal / 1000
              )} ${this.i18nStore.translate("Mbps")}`
            : "-",
      },
      {
        columnDef: "upload_kbit_normal",
        header: "UL (normal)",
        transformValue: (value) =>
          value.upload_kbit_normal
            ? `${roundToSignificantDigits(
                value.upload_kbit_normal / 1000
              )} ${this.i18nStore.translate("Mbps")}`
            : "-",
      },
      {
        columnDef: "last_updated",
        header: "Last updated",
      },
    ]
  }

  constructor(
    readonly dialogRef: MatDialogRef<CoverageDialogComponent>,
    @Inject(MAT_DIALOG_DATA)
    public readonly data: {
      query: URLSearchParams
      coverages: IBasicResponse<ICoverage> | null
    },
    private readonly i18nStore: I18nStore,
    private readonly mapService: MapService,
    private readonly zone: NgZone
  ) {
    const lon = +data.query.get("long")!
    const lat = +data.query.get("lat")!
    this.coverageText$ = this.i18nStore
      .getLocalizedHtml("coverage")
      .pipe(
        map((html) =>
          html.replace(
            "{{ location }}",
            formatcoords(lat, lon).format(LOC_FORMAT)
          )
        )
      )
  }

  ngAfterViewInit(): void {
    if (this.data.coverages?.content[0]?.raster_geo_json) {
      this.setMap().then(() => {
        this.map?.on("load", () => {
          this.setResizeSub()
          this.addPolygon(this.data.coverages?.content[0]?.raster_geo_json!)
          setTimeout(() => this.setSize(), 0)
        })
      })
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }

  close() {
    this.dialogRef.close()
  }

  private setResizeSub() {
    if (!this.map) {
      return
    }
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
        .setAttribute("style", `height:250px;width:${containerWidth - 16}px`)
    })
  }

  private async setMap() {
    this.zone.runOutsideAngular(() => {
      this.mapService
        .createMap({
          container: this.mapId,
          style: this.mapService.defaultStyle(),
          center: DEFAULT_CENTER,
        })
        .pipe(takeUntil(this.destroyed$))
        .subscribe((map) => {
          this.map = map
          this.map.addControl(new NavigationControl())
        })
    })
  }

  private addPolygon(polygon: GeoJSON.MultiPolygon) {
    this.zone.runOutsideAngular(() => {
      this.map?.addSource("coverage-polygon", {
        type: "geojson",
        data: polygon,
      })
      this.map?.addLayer({
        id: "coverage-polygon-fill",
        type: "fill",
        source: "coverage-polygon",
        paint: {
          "fill-color": "#fff",
          "fill-opacity": 0.5,
        },
      })
      this.map?.addLayer({
        id: "coverage-polygon-line",
        type: "line",
        source: "coverage-polygon",
        paint: {
          "line-color": "#347fbc",
          "line-width": 1,
        },
      })
      const line = lineString(polygon.coordinates[0][0])
      const box = bbox(line) as [number, number, number, number]
      this.map?.fitBounds(box, {
        animate: false,
        padding: { top: 100, bottom: 100 },
      })
    })
  }
}
