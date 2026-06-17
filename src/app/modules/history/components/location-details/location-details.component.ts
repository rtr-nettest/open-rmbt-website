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
  // this table has many columns (incl. the wide lat/long position), so use the
  // full available width instead of the narrow default cap
  override width = "100%"
  // on mobile, swap the wide multi-column layout into stacked label/value rows
  override tableClassNames = ["app-table--vertical"]
  override columns: ITableColumn<ISimpleHistoryTestLocation>[] = [
    {
      columnDef: "time_elapsed",
      header: "Time",
      transformValue: (row) =>
        row.time_elapsed != null
          ? `${roundMs(row.time_elapsed / 1e3)} ${this.i18nStore.translate(
              "s"
            )}`
          : "",
      getNgClass: () => "app-cell--10",
    },
    {
      columnDef: "position",
      header: "Position",
      transformValue: (row) =>
        row.lat != null && row.long != null
          ? formatcoords(row.lat, row.long).format(LOC_FORMAT)
          : "",
    },
    {
      columnDef: "loc_accuracy",
      header: "Accuracy",
      transformValue: (row) =>
        row.loc_accuracy != null
          ? `+/-${row.loc_accuracy.toLocaleString(this.i18nStore.activeLang, {
              minimumFractionDigits: 1,
              maximumFractionDigits: 1,
            })} ${this.i18nStore.translate("m")}`
          : "",
      getNgClass: () => "app-cell--12",
    },
    {
      columnDef: "speed",
      header: "Speed",
      transformValue: (row) =>
        row.speed != null
          ? `${(row.speed * 3.6).toLocaleString(this.i18nStore.activeLang, {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2,
            })} ${this.i18nStore.translate("km/h")}`
          : "",
      getNgClass: () => "app-cell--12",
    },
    {
      columnDef: "altitude",
      header: "altitude",
      transformValue: (row) =>
        row.altitude != null
          ? `${Math.round(row.altitude).toLocaleString(
              this.i18nStore.activeLang
            )} ${this.i18nStore.translate("m")}`
          : "",
      getNgClass: () => "app-cell--10",
    },
    {
      columnDef: "bearing",
      header: "bearing",
      transformValue: (row) =>
        row.bearing != null
          ? `${Math.round(row.bearing).toLocaleString(
              this.i18nStore.activeLang
            )}°`
          : "",
      getNgClass: () => "app-cell--10",
    },
    {
      columnDef: "loc_src",
      header: "Source",
      transformValue: (row) => row.loc_src ?? "",
      getNgClass: () => "app-cell--10",
    },
  ]

  override onExpand($event: boolean): void {
    this.expand.emit($event)
    super.onExpand($event)
  }
}
