import { ChangeDetectionStrategy, Component } from "@angular/core"
import {
  imports,
  ShowDetailsComponent,
} from "../../../shared/components/show-details/show-details.component"
import { IPing } from "../../interfaces/measurement-result.interface"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { roundMs } from "../../../shared/util/math"

@Component({
  selector: "app-ping-details",
  imports,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:
    "../../../shared/components/show-details/show-details.component.html",
  styleUrl:
    "../../../shared/components/show-details/show-details.component.scss",
})
export class PingDetailsComponent extends ShowDetailsComponent<IPing> {
  override columns: ITableColumn<IPing>[] = [
    {
      columnDef: "number",
      header: "#",
      transformValue: (row, col, i) => (i != undefined ? i + 1 : ""),
      getNgClass: () => "app-cell--25",
    },
    {
      columnDef: "time_ns",
      header: "Time",
      transformValue: (row) =>
        `${roundMs(row.time_ns / 1e9)} ${this.i18nStore.translate("s")}`,
    },
    {
      columnDef: "value_server",
      header: "Ping",
      transformValue: (row) =>
        `${roundMs(row.value_server / 1e6)} ${this.i18nStore.translate(
          "millis"
        )}`,
    },
  ]
}
