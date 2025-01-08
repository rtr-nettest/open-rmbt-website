import { ChangeDetectionStrategy, Component } from "@angular/core"
import { TableComponent } from "../../../tables/components/table/table.component"
import { MatExpansionModule } from "@angular/material/expansion"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { ShowDetailsComponent } from "../../../shared/components/show-details/show-details.component"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { roundMs } from "../../../shared/util/math"
import formatcoords from "formatcoords"
import { LOC_FORMAT } from "../../../shared/pipes/lonlat.pipe"
import { ISimpleHistoryTestLocation } from "../../../history/interfaces/simple-history-result.interface"

@Component({
  selector: "app-location-details",
  standalone: true,
  imports: [TableComponent, MatExpansionModule, TranslatePipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl:
    "../../../shared/components/show-details/show-details.component.html",
  styleUrl:
    "../../../shared/components/show-details/show-details.component.scss",
})
export class LocationDetailsComponent extends ShowDetailsComponent<ISimpleHistoryTestLocation> {
  override columns: ITableColumn<ISimpleHistoryTestLocation>[] = [
    {
      columnDef: "time_elapsed",
      header: `${this.i18nStore.translate("Time")}, ${this.i18nStore.translate(
        "s"
      )}`,
      transformValue: (row) => roundMs(row.time_elapsed / 1e3),
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
      header: `${this.i18nStore.translate(
        "Accuracy"
      )}, ${this.i18nStore.translate("m")}`,
      transformValue: (row) => `+/-${Math.round(row.loc_accuracy)}`,
      getNgClass: () => "app-cell--25",
    },
  ]
}
