import { ChangeDetectionStrategy, Component } from "@angular/core"
import {
  imports,
  ShowDetailsComponent,
} from "../../../shared/components/show-details/show-details.component"
import { ISimpleHistorySignal } from "../../interfaces/simple-history-result.interface"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { roundMs } from "../../../shared/util/math"
import { CellInfoComponent } from "../cell-info/cell-info.component"

@Component({
  selector: "app-signal-details",
  imports,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:
    "../../../shared/components/show-details/show-details.component.html",
  styleUrl:
    "../../../shared/components/show-details/show-details.component.scss",
})
export class SignalDetailsComponent extends ShowDetailsComponent<ISimpleHistorySignal> {
  override columns: ITableColumn<ISimpleHistorySignal>[] = [
    {
      columnDef: "time_elapsed",
      header: "Time",
      transformValue: (row) =>
        `${roundMs(row.time_elapsed / 1e3)} ${this.i18nStore.translate("s")}`,
      getNgClass: () => "app-cell--20",
    },
    {
      columnDef: "signal_strength",
      header: "Signal strength",
      component: CellInfoComponent,
      getComponentParameters: (row) => row,
      getNgClass: () => "app-cell--signal-strength",
    },
    {
      columnDef: "cat_technology",
      header: "Technology",
      getNgClass: () => "app-cell--20",
    },
  ]
  override width: string = "min(600px, 100%)"
}
