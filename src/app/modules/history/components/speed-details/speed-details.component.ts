import { ChangeDetectionStrategy, Component } from "@angular/core"
import { IOverallResult } from "../../interfaces/overall-result.interface"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { roundMs, roundToSignificantDigits } from "../../../shared/util/math"
import { ShowDetailsComponent } from "../../../shared/components/show-details/show-details.component"
import { TableComponent } from "../../../tables/components/table/table.component"
import { MatExpansionModule } from "@angular/material/expansion"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"

@Component({
  selector: "app-speed-details",
  standalone: true,
  imports: [TableComponent, MatExpansionModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:
    "../../../shared/components/show-details/show-details.component.html",
  styleUrl:
    "../../../shared/components/show-details/show-details.component.scss",
})
export class SpeedDetailsComponent extends ShowDetailsComponent<IOverallResult> {
  override columns: ITableColumn<IOverallResult>[] = [
    {
      columnDef: "nsec",
      header: "Time",
      transformValue: (row) =>
        `${roundMs(row.nsec / 1e9)} ${this.i18nStore.translate("s")}`,
      getNgClass: () => "app-cell--25",
    },
    {
      columnDef: "speed",
      header: "Speed",
      transformValue: (row) =>
        `${roundToSignificantDigits(
          row.speed / 1e6
        )} ${this.i18nStore.translate("Mbps")}`,
    },
    {
      columnDef: "bytes",
      header: "Data volume",
      transformValue: (row) =>
        `${roundToSignificantDigits(
          row.bytes / 1e6
        )} ${this.i18nStore.translate("MB")}`,
    },
  ]
}
