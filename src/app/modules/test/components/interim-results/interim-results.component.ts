import { ChangeDetectionStrategy, Component, signal } from "@angular/core"
import { distinctUntilChanged, Observable, tap } from "rxjs"
import { EMeasurementStatus } from "../../constants/measurement-status.enum"
import { TestStore } from "../../store/test.store"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { AsyncPipe, DatePipe, NgIf } from "@angular/common"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { TestChartComponent } from "../../../charts/components/test-chart/test-chart.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { LonlatPipe } from "../../../shared/pipes/lonlat.pipe"
import { IBasicNetworkInfo } from "../../interfaces/basic-network-info.interface"
import { ITestVisualizationState } from "../../interfaces/test-visualization-state.interface"
import { roundToSignificantDigits } from "../../../shared/util/math"
import { LoopStoreService } from "../../../loop/store/loop-store.service"
import { toObservable } from "@angular/core/rxjs-interop"
import { NUMBERS_LOCALE } from "../../../shared/constants/strings"

@Component({
  selector: "app-interim-results",
  templateUrl: "./interim-results.component.html",
  styleUrls: ["./interim-results.component.scss"],
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    AsyncPipe,
    DatePipe,
    LonlatPipe,
    MatProgressSpinnerModule,
    NgIf,
    TestChartComponent,
    TranslatePipe,
  ],
})
export class InterimResultsComponent {
  basicNetworkInfo$!: Observable<IBasicNetworkInfo>
  visualization$!: Observable<ITestVisualizationState>
  estimatedEndTime = signal<Date | null>(null)

  ping: string = "-"
  download: string = "-"
  upload: string = "-"

  phases = EMeasurementStatus

  constructor(
    private i18nStore: I18nStore,
    private store: TestStore,
    private loopStore: LoopStoreService
  ) {
    this.basicNetworkInfo$ = toObservable(this.store.basicNetworkInfo)
    this.visualization$ = this.store.visualization$.pipe(
      distinctUntilChanged(),
      tap((state) => {
        const estimatedEndTime = this.loopStore.estimatedEndTime()
        if (estimatedEndTime) {
          this.estimatedEndTime.set(new Date(estimatedEndTime))
        }
        const ping = roundToSignificantDigits(
          state.phases[EMeasurementStatus.DOWN].ping
        )
        this.ping =
          ping < 0
            ? "-"
            : ping.toLocaleString(NUMBERS_LOCALE) +
              " " +
              this.i18nStore.translate("millis")
        const download = roundToSignificantDigits(
          state.phases[EMeasurementStatus.DOWN].down
        )
        this.download =
          download < 0
            ? "-"
            : download.toLocaleString(NUMBERS_LOCALE) +
              " " +
              this.i18nStore.translate("Mbps")
        const upload = roundToSignificantDigits(
          state.phases[EMeasurementStatus.UP].up
        )
        this.upload =
          upload < 0
            ? "-"
            : upload.toLocaleString(NUMBERS_LOCALE) +
              " " +
              this.i18nStore.translate("Mbps")
      })
    )
  }
}
