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
      header: "Fence time",
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
      // Three lines: latitude, longitude, altitude (when available).
      isHtml: true,
      transformValue: (row) => {
        if (!row.latitude || !row.longitude) {
          return "-"
        }
        const coords = formatcoords(row.latitude, row.longitude).format(
          LOC_FORMAT,
          { latLonSeparator: "<br>" },
        )
        return row.altitude != null
          ? `${coords}<br>${Math.round(row.altitude)} ${this.i18nStore.translate("m")}`
          : coords
      },
      getNgClass: () => "app-cell--20",
    },
    {
      columnDef: "speed",
      header: "Velocity",
      transformValue: (row) =>
        row.speed != null
          ? `${(row.speed * 3.6).toLocaleString(this.i18nStore.activeLang, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ${this.i18nStore.translate("km/h")}`
          : "-",
    },
    {
      columnDef: "duration_ms",
      header: "Duration",
      transformValue: (row) =>
        row.duration_ms
          ? `${Math.round(row.duration_ms / 1e3)} ${this.i18nStore.translate("s")}`
          : "-",
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
