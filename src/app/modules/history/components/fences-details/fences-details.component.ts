import {
  ChangeDetectionStrategy,
  Component,
  input,
  OnInit,
  output,
} from "@angular/core"
import {
  imports,
  ShowDetailsComponent,
} from "../../../shared/components/show-details/show-details.component"
import { IFenceItem } from "../../interfaces/open-test-response"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import formatcoords from "formatcoords"
import { LOC_FORMAT } from "../../../shared/pipes/lonlat.pipe"
import dayjs from "dayjs"
import { getMobileNetworkTechnology } from "../../constants/network-technology"
import { roundToSignificantDigits } from "../../../shared/util/math"

@Component({
  selector: "app-fences-details",
  imports,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:
    "../../../shared/components/show-details/show-details.component.html",
  styleUrl:
    "../../../shared/components/show-details/show-details.component.scss",
})
export class FencesDetailsComponent
  extends ShowDetailsComponent<IFenceItem>
  implements OnInit
{
  expand = output<boolean>()
  // "Technology only" (iOS measurements, or Android with the toggle on):
  // there is no signal to show, so the "Signal" column is dropped.
  technologyOnly = input<boolean>(false)
  override columns: ITableColumn<IFenceItem>[] = [
    {
      columnDef: "fence_id",
      header: "ID",
    },
    {
      columnDef: "fence_time",
      header: "Time",
      // Two lines: date, then time of day.
      isHtml: true,
      transformValue: (row) =>
        row.fence_time
          ? `${dayjs(row.fence_time).format("YYYY-MM-DD")}<br>${dayjs(
              row.fence_time,
            ).format("HH:mm:ss")}`
          : "-",
      getNgClass: () => "app-cell--15",
    },
    {
      columnDef: "position",
      header: "Position",
      // Three lines: latitude, longitude, altitude with accuracy (when
      // available), e.g. "153 m (+/- 5m)".
      isHtml: true,
      transformValue: (row) => {
        if (!row.latitude || !row.longitude) {
          return "-"
        }
        const coords = formatcoords(row.latitude, row.longitude).format(
          LOC_FORMAT,
          { latLonSeparator: "<br>" },
        )
        const m = this.i18nStore.translate("m")
        if (row.altitude == null) {
          return coords
        }
        const accuracy =
          row.accuracy != null ? ` (+/- ${Math.round(row.accuracy)} ${m})` : ""
        return `${coords}<br>${Math.round(row.altitude)} ${m}${accuracy}`
      },
      getNgClass: () => "app-cell--12",
    },
    {
      columnDef: "duration_ms",
      header: "At point",
      // Time spent in the fence and its radius, e.g. "3 s / 15m".
      transformValue: (row) => {
        const duration = row.duration_ms
          ? `${Math.round(row.duration_ms / 1e3)} ${this.i18nStore.translate("s")}`
          : null
        const radius =
          row.radius != null
            ? `${Math.round(row.radius)} ${this.i18nStore.translate("m")}`
            : null
        const parts = [duration, radius].filter(Boolean)
        return parts.length ? parts.join(" / ") : "-"
      },
    },
    {
      columnDef: "speed",
      header: "Velocity",
      // Two lines: velocity, then bearing (heading in degrees).
      isHtml: true,
      transformValue: (row) => {
        if (row.speed == null) {
          return "-"
        }
        const velocity = `${(row.speed * 3.6).toLocaleString(
          this.i18nStore.activeLang,
          { minimumFractionDigits: 1, maximumFractionDigits: 1 },
        )} ${this.i18nStore.translate("km/h")}`
        return row.bearing != null
          ? `${velocity}<br>${Math.round(row.bearing)}°`
          : velocity
      },
    },
    {
      columnDef: "technology_id",
      header: "Technology",
      transformValue: (row) => getMobileNetworkTechnology(row.technology_id),
    },
    {
      columnDef: "avg_ping_ms",
      header: "Ping",
      transformValue: (row) =>
        row.avg_ping_ms
          ? `${roundToSignificantDigits(row.avg_ping_ms)} ${this.i18nStore.translate("millis")}`
          : "-",
    },
    {
      columnDef: "signal",
      header: "Signal",
      transformValue: (row) =>
        row.signal ? `${row.signal} ${this.i18nStore.translate("dBm")}` : "-",
    },
  ]
  override tableClassNames: string[] = [
    "app-table--bordered",
    "app-table--default",
  ]
  override width = "100%"

  ngOnInit(): void {
    if (this.technologyOnly()) {
      this.columns = this.columns.filter((c) => c.columnDef !== "signal")
    }
  }

  override onExpand($event: boolean): void {
    this.expand.emit($event)
    super.onExpand($event)
  }
}
