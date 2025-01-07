import {
  ChangeDetectionStrategy,
  Component,
  computed,
  input,
} from "@angular/core"
import { IOverallResult } from "../../interfaces/overall-result.interface"
import { IBasicResponse } from "../../../tables/interfaces/basic-response.interface"
import { ISort } from "../../../tables/interfaces/sort.interface"
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
      header: `${this.i18nStore.translate("Time")}, ${this.i18nStore.translate(
        "s"
      )}`,
      transformValue: (row) => roundMs(row.nsec / 1e9),
      getNgClass: () => "app-cell--25",
    },
    {
      columnDef: "speed",
      header: `${this.i18nStore.translate("Speed")}, ${this.i18nStore.translate(
        "Mbps"
      )}`,
      transformValue: (row) => roundToSignificantDigits(row.speed / 1e6),
    },
    {
      columnDef: "bytes",
      header: `${this.i18nStore.translate(
        "Data volume"
      )}, ${this.i18nStore.translate("MB")}`,
      transformValue: (row) => roundToSignificantDigits(row.bytes / 1e6),
    },
  ]
}
