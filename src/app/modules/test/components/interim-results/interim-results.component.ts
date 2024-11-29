import { ChangeDetectionStrategy, Component } from "@angular/core"
import { Observable, tap } from "rxjs"
import { EMeasurementStatus } from "../../constants/measurement-status.enum"
import { ConversionService } from "../../../shared/services/conversion.service"
import { TestStore } from "../../store/test.store"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { AsyncPipe, NgIf } from "@angular/common"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { TestChartComponent } from "../test-chart/test-chart.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"

@Component({
  selector: "app-interim-results",
  templateUrl: "./interim-results.component.html",
  styleUrls: ["./interim-results.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    AsyncPipe,
    MatProgressSpinnerModule,
    NgIf,
    TestChartComponent,
    TranslatePipe,
  ],
})
export class InterimResultsComponent {
  visualization$!: Observable<any>

  ping: string = "-"
  download: string = "-"
  upload: string = "-"

  phases = EMeasurementStatus

  constructor(
    private conversionService: ConversionService,
    private i18nStore: I18nStore,
    private store: TestStore
  ) {
    this.visualization$ = this.store.visualization$.pipe(
      tap((state) => {
        const locale = this.i18nStore.activeLang
        const ping = this.conversionService.getSignificantDigits(
          state.phases[EMeasurementStatus.DOWN].ping
        )
        this.ping =
          ping < 0
            ? "-"
            : ping.toLocaleString(locale) + " " + this.i18nStore.translate("ms")
        const download = this.conversionService.getSignificantDigits(
          state.phases[EMeasurementStatus.DOWN].down
        )
        this.download =
          download < 0
            ? "-"
            : download.toLocaleString(locale) +
              " " +
              this.i18nStore.translate("Mbps")
        const upload = this.conversionService.getSignificantDigits(
          state.phases[EMeasurementStatus.UP].up
        )
        this.upload =
          upload < 0
            ? "-"
            : upload.toLocaleString(locale) +
              " " +
              this.i18nStore.translate("Mbps")
      })
    )
  }
}
