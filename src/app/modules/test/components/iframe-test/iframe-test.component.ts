import {
  ChangeDetectionStrategy,
  Component,
  effect,
  inject,
  input,
  signal,
} from "@angular/core"
import { TestStore } from "../../store/test.store"
import { distinctUntilChanged, tap } from "rxjs"
import { AsyncPipe, DatePipe } from "@angular/common"
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
import { BasicNetworkInfo } from "../../dto/basic-network-info.dto"
import { TestVisualizationState } from "../../dto/test-visualization-state.dto"
import { ITestVisualizationState } from "../../interfaces/test-visualization-state.interface"
import { AnnouncerService } from "../../../shared/services/announcer.service"
import { PROGRESS_ANNOUNCEMENT_RATE } from "../../constants/numbers"

const DEFAULT_VALUE = "-"

@Component({
  selector: "app-iframe-test",
  imports: [
    AsyncPipe,
    DatePipe,
    MatButtonModule,
    MatProgressSpinnerModule,
    TranslatePipe,
  ],
  templateUrl: "./iframe-test.component.html",
  styleUrl: "./iframe-test.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class IframeTestComponent {
  announcerService = inject(AnnouncerService)
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
  showFooter = input(true)
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
      if (
        this.currentPhaseName() === EMeasurementStatus.END &&
        this.estimatedEndTime()
      ) {
        // It's a loop test, so we're waiting for the next test
        this.status.set("Waiting")
      } else {
        this.status.set(this.currentPhaseName())
      }
      this.ping.set(
        !currentPhase.ping || currentPhase.ping === -1
          ? DEFAULT_VALUE
          : `${roundToSignificantDigits(
              currentPhase.ping
            )} ${this.i18nStore.translate("millis")}`
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

      this.notifyParent(state)
    })
  )
  isWaitingForNextTest = input(false)
  waitingProgress = input(0)
  waitingProgressMs = input(0)
  estimatedEndTime = input<Date | null>(null)
  announcedWaitingProgress: number | null = null

  private parentWindowMessage = ""

  constructor() {
    effect(() => {
      if (this.isWaitingForNextTest()) {
        const progress =
          Math.floor(this.waitingProgress() / PROGRESS_ANNOUNCEMENT_RATE) *
          PROGRESS_ANNOUNCEMENT_RATE
        if (
          progress % PROGRESS_ANNOUNCEMENT_RATE === 0 &&
          progress !== this.announcedWaitingProgress
        ) {
          this.announcedWaitingProgress = progress
          this.announcerService.polite(
            this.i18nStore.translate("Waiting progress") + " " + progress + "%"
          )
        }
      } else if (this.progress() % PROGRESS_ANNOUNCEMENT_RATE === 0) {
        this.announcedWaitingProgress = null
        this.announcerService.polite(
          this.i18nStore.translate("Test progress") +
            " " +
            this.progress() +
            "%"
        )
      }
    })
  }

  notifyParent(state: ITestVisualizationState) {
    if (parent.window && typeof parent.window.postMessage === "function") {
      if (
        state.currentPhaseName === EMeasurementStatus.INIT &&
        !this.parentWindowMessage
      ) {
        this.parentWindowMessage = "start"
        parent.window.postMessage(
          {
            type: "start",
          },
          "*"
        )
      }
      if (
        state.currentPhaseName === EMeasurementStatus.END &&
        this.parentWindowMessage === "start"
      ) {
        this.parentWindowMessage = ""
        parent.window.postMessage(
          {
            type: "end",
          },
          "*"
        )
      }
    }
  }

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
    this.testStore.visualization$.next(new TestVisualizationState())
    this.testStore.basicNetworkInfo.set(new BasicNetworkInfo())
    this.testService.triggerNextIframeTest()
  }
}
