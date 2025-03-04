import { Component, inject, signal } from "@angular/core"
import { TestStore } from "../../store/test.store"
import { distinctUntilChanged, tap, withLatestFrom } from "rxjs"
import { AsyncPipe } from "@angular/common"
import { TestService } from "../../services/test.service"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { LonlatPipe } from "../../../shared/pipes/lonlat.pipe"
import { EMeasurementStatus } from "../../constants/measurement-status.enum"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { roundToSignificantDigits } from "../../../shared/util/math"
import { environment } from "../../../../../environments/environment"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { MatButtonModule } from "@angular/material/button"

const DEFAULT_VALUE = "-"

@Component({
  selector: "app-iframe-test",
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: "./iframe-test.component.html",
  styleUrl: "./iframe-test.component.scss",
})
export class IframeTestComponent {
  i18nStore = inject(I18nStore)
  lonlatPipe = inject(LonlatPipe)
  testService = inject(TestService)
  testStore = inject(TestStore)
  coordinates = signal(DEFAULT_VALUE)
  currentPhaseName = signal(DEFAULT_VALUE)
  down = signal(DEFAULT_VALUE)
  ip = signal(DEFAULT_VALUE)
  ping = signal(DEFAULT_VALUE)
  progress = signal(0)
  provider = signal(DEFAULT_VALUE)
  resultUrl = signal("")
  status = signal(DEFAULT_VALUE)
  testServer = signal(DEFAULT_VALUE)
  up = signal(DEFAULT_VALUE)
  visualization$ = this.testStore.visualization$.pipe(
    distinctUntilChanged(),
    tap((state) => {
      this.currentPhaseName.set(state.currentPhaseName)
      const currentPhase = state.phases[this.currentPhaseName()]
      const basicNetworkInfo = this.testStore.basicNetworkInfo()
      this.progress.set(
        this.testService.getProgressSegment(
          this.currentPhaseName() as EMeasurementStatus,
          currentPhase.progress
        )
      )
      this.status.set(this.currentPhaseName())
      this.ping.set(
        !currentPhase.ping || currentPhase.ping === -1
          ? DEFAULT_VALUE
          : `${currentPhase.ping} ${this.i18nStore.translate("millis")}`
      )
      this.down.set(
        !currentPhase.down || currentPhase.down === -1
          ? DEFAULT_VALUE
          : `${roundToSignificantDigits(
              currentPhase.down
            )} ${this.i18nStore.translate("Mbps")}`
      )
      this.up.set(
        !currentPhase.up || currentPhase.up === -1
          ? DEFAULT_VALUE
          : `${roundToSignificantDigits(
              currentPhase.up
            )} ${this.i18nStore.translate("Mbps")}`
      )
      this.coordinates.set(
        !basicNetworkInfo.coordinates
          ? DEFAULT_VALUE
          : this.lonlatPipe.transform(basicNetworkInfo.coordinates) ||
              DEFAULT_VALUE
      )
      this.ip.set(
        !basicNetworkInfo.ipAddress ? DEFAULT_VALUE : basicNetworkInfo.ipAddress
      )
      this.provider.set(
        !basicNetworkInfo.providerName
          ? DEFAULT_VALUE
          : basicNetworkInfo.providerName
      )
      this.testServer.set(
        !basicNetworkInfo.serverName
          ? DEFAULT_VALUE
          : basicNetworkInfo.serverName
      )
      this.resultUrl.set(
        `${environment.deployedUrl}/${this.i18nStore.activeLang}/${ERoutes.RESULT}?test_uuid=${currentPhase.testUuid}`
      )
    })
  )

  restart() {
    this.coordinates.set(DEFAULT_VALUE)
    this.currentPhaseName.set(DEFAULT_VALUE)
    this.down.set(DEFAULT_VALUE)
    this.ip.set(DEFAULT_VALUE)
    this.ping.set(DEFAULT_VALUE)
    this.progress.set(0)
    this.provider.set(DEFAULT_VALUE)
    this.resultUrl.set("")
    this.status.set(DEFAULT_VALUE)
    this.testServer.set(DEFAULT_VALUE)
    this.up.set(DEFAULT_VALUE)
    this.testService.triggerNextTest()
  }
}
