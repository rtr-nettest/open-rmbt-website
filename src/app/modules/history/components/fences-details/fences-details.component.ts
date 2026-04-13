import { ChangeDetectionStrategy, Component, output } from "@angular/core"
import {
  imports,
  ShowDetailsComponent,
} from "../../../shared/components/show-details/show-details.component"
import { IFenceItem } from "../../interfaces/open-test-response"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import formatcoords from "formatcoords"
import { LOC_FORMAT } from "../../../shared/pipes/lonlat.pipe"
import dayjs from "dayjs"
import { RESULT_DATE_FORMAT } from "../../../test/constants/strings"

@Component({
  selector: "app-fences-details",
  imports,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:
    "../../../shared/components/show-details/show-details.component.html",
  styleUrl:
    "../../../shared/components/show-details/show-details.component.scss",
})
export class FencesDetailsComponent extends ShowDetailsComponent<IFenceItem> {
  expand = output<boolean>()
  override columns: ITableColumn<IFenceItem>[] = [
    {
      columnDef: "fence_id",
      header: "ID",
    },
    {
      columnDef: "technology",
      header: "Technology",
    },
    {
      columnDef: "avg_ping_ms",
      header: "Ping",
      transformValue: (row) =>
        row.avg_ping_ms
          ? `${Math.round(row.avg_ping_ms)} ${this.i18nStore.translate("millis")}`
          : "N/A",
    },
    {
      columnDef: "offset_ms",
      header: "Offset",
      transformValue: (row) =>
        row.offset_ms
          ? `${Math.round(row.offset_ms / 1e3)} ${this.i18nStore.translate("s")}`
          : "N/A",
    },
    {
      columnDef: "duration_ms",
      header: "Duration",
      transformValue: (row) =>
        row.duration_ms
          ? `${Math.round(row.duration_ms / 1e3)} ${this.i18nStore.translate("s")}`
          : "N/A",
    },
    {
      columnDef: "radius",
      header: "Radius",
      transformValue: (row) =>
        row.radius
          ? `${Math.round(row.radius)} ${this.i18nStore.translate("m")}`
          : "N/A",
    },
    {
      columnDef: "position",
      header: "Position",
      transformValue: (row) =>
        row.latitude && row.longitude
          ? formatcoords(row.latitude, row.longitude).format(LOC_FORMAT)
          : "N/A",
      getNgClass: () => "app-cell--20",
    },
    {
      columnDef: "fence_time",
      header: "Fence time",
      transformValue: (row) =>
        row.fence_time
          ? dayjs(row.fence_time).format(RESULT_DATE_FORMAT)
          : "N/A",
      getNgClass: () => "app-cell--20",
    },
    {
      columnDef: "signal",
      header: "Signal",
      transformValue: (row) =>
        row.signal ? `${Math.round(row.signal)} dBm` : "N/A",
    },
  ]
  override tableClassNames: string[] = [
    "app-table--bordered",
    "app-table--default",
  ]
  override width = "100%"

  override onExpand($event: boolean): void {
    this.expand.emit($event)
    super.onExpand($event)
  }
}
