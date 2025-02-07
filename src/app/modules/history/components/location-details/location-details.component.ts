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
        `+/-${Math.round(row.loc_accuracy)} ${this.i18nStore.translate("m")}`,
      getNgClass: () => "app-cell--25",
    },
  ]
}
