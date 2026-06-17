import { ChangeDetectionStrategy, Component, output } from "@angular/core"
import {
  imports,
  ShowDetailsComponent,
} from "../../../shared/components/show-details/show-details.component"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { roundMs } from "../../../shared/util/math"
import formatcoords from "formatcoords"
import { LOC_FORMAT } from "../../../shared/pipes/lonlat.pipe"
import { ISimpleHistoryTestLocation } from '../../interfaces/simple-history-result.interface'

@Component({
  selector: "app-location-details",
  imports,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:
    "../../../shared/components/show-details/show-details.component.html",
  styleUrl:
    "../../../shared/components/show-details/show-details.component.scss",
})
export class LocationDetailsComponent extends ShowDetailsComponent<ISimpleHistoryTestLocation> {
  expand = output<boolean>()
  override columns: ITableColumn<ISimpleHistoryTestLocation>[] = [
    {
      columnDef: "time_elapsed",
      header: "Time",
      transformValue: (row) =>
        `${roundMs(row.time_elapsed / 1e3)} ${this.i18nStore.translate("s")}`,
      getNgClass: () => "app-cell--20",
    },
    {
      columnDef: "position",
      header: "Position",
      transformValue: (row) =>
        formatcoords(row.lat, row.long).format(LOC_FORMAT),
    },
    {
      columnDef: "loc_accuracy",
      header: "Accuracy",
      transformValue: (row) =>
        `+/-${row.loc_accuracy.toFixed(1)} ${this.i18nStore.translate("m")}`,
      getNgClass: () => "app-cell--25",
    },
    {
      columnDef: "speed",
      header: "Speed",
      transformValue: (row) =>
        row.speed != null
          ? `${(row.speed * 3.6).toFixed(2)} ${this.i18nStore.translate(
              "km/h"
            )}`
          : "-",
    },
    {
      columnDef: "altitude",
      header: "altitude",
      transformValue: (row) =>
        row.altitude != null
          ? `${Math.round(row.altitude)} ${this.i18nStore.translate("m")}`
          : "-",
    },
    {
      columnDef: "bearing",
      header: "bearing",
      transformValue: (row) =>
        row.bearing != null ? `${Math.round(row.bearing)}°` : "-",
    },
    {
      columnDef: "loc_src",
      header: "Source",
      transformValue: (row) => row.loc_src || "-",
    },
  ]

  override onExpand($event: boolean): void {
    this.expand.emit($event)
    super.onExpand($event)
  }
}
