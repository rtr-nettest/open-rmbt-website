import {
  Component,
  computed,
  HostListener,
  inject,
  NgZone,
  OnInit,
  signal,
} from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { Router } from "@angular/router"
import {
  BehaviorSubject,
  distinctUntilChanged,
  firstValueFrom,
  map,
  Observable,
  Subject,
  withLatestFrom,
} from "rxjs"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { AsyncPipe, DatePipe, NgIf, NgTemplateOutlet } from "@angular/common"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { TestStore } from "../../store/test.store"
import { EMeasurementStatus } from "../../constants/measurement-status.enum"
import { ITestVisualizationState } from "../../interfaces/test-visualization-state.interface"
import {
  ERROR_OCCURED,
  ERROR_OCCURED_SENDING_RESULTS,
  TC_VERSION_ACCEPTED,
} from "../../constants/strings"
import { MessageService } from "../../../shared/services/message.service"
import { SpacerComponent } from "../../../shared/components/spacer/spacer.component"
import { GaugeComponent } from "../../components/gauge/gauge.component"
import { InterimResultsComponent } from "../../components/interim-results/interim-results.component"
import { TestService } from "../../services/test.service"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { MainStore } from "../../../shared/store/main.store"
import { HistoryService } from "../../../history/services/history.service"
import { RecentHistoryComponent } from "../../../history/components/recent-history/recent-history.component"
import { LoopStoreService } from "../../../loop/store/loop-store.service"
import { toObservable } from "@angular/core/rxjs-interop"
import { SprintfPipe } from "../../../shared/pipes/sprintf.pipe"
import { SettingsService } from "../../../shared/services/settings.service"
import { PlatformService } from "../../../shared/services/platform.service"
import { environment } from "../../../../../environments/environment"
import { IframeTestComponent } from "../../components/iframe-test/iframe-test.component"

export const imports = [
  AsyncPipe,
  BreadcrumbsComponent,
  DatePipe,
  HeaderComponent,
  FooterComponent,
  GaugeComponent,
  IframeTestComponent,
  InterimResultsComponent,
  MatProgressBarModule,
  NgIf,
  RecentHistoryComponent,
  TopNavComponent,
  TranslatePipe,
  SpacerComponent,
  SprintfPipe,
  BreadcrumbsComponent,
  NgTemplateOutlet,
]

@Component({
  selector: "app-test-screen",
  standalone: true,
  imports,
  templateUrl: "./test-screen.component.html",
  styleUrl: "./test-screen.component.scss",
})
export class TestScreenComponent extends SeoComponent implements OnInit {
  addMedian = false
  currentRoute: string | null = null
  nextRoute = ERoutes.TEST
  disableGraphics = computed(
    () =>
      this.loopStore.isCertifiedMeasurement() &&
      environment.certifiedDefaults.disable_graphics
  )
  historyService = inject(HistoryService)
  router = inject(Router)
  mainStore = inject(MainStore)
  message = inject(MessageService)
  ngZone = inject(NgZone)
  service = inject(TestService)
  settingsService = inject(SettingsService)
  store = inject(TestStore)
  loopStore = inject(LoopStoreService)
  isLoopModeEnabled$ = toObservable(this.loopStore.isLoopModeEnabled)
  loopCount$ = toObservable(this.loopStore.loopCounter)
  stopped$: Subject<void> = new Subject()
  visualization$!: Observable<ITestVisualizationState>
  loopWaiting = signal(false)
  result$ = this.historyService.getHistoryGroupedByLoop({
    grouped: false,
    loopUuid: this.loopStore.loopUuid(),
  })
  progressMs = signal(0)
  progressFormatted = computed(() => {
    const h = Math.floor(this.progressMs() / 3600000)
    const m = Math.floor((this.progressMs() % 3600000) / 60000)
    const s = Math.floor((this.progressMs() % 60000) / 1000)
    return `${h.toString().padStart(2, "0")}:${m
      .toString()
      .padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  })
  progress = signal(0)
  progressMode = signal<"determinate" | "indeterminate">("determinate")
  platform = inject(PlatformService)
  testStartDisabled = signal(false)
  protected excludeColumns: string[] = []

  ngOnInit(): void {
    if (!globalThis.localStorage) {
      return
    }
    this.historyService.resetMeasurementHistory()
    firstValueFrom(this.settingsService.getSettings()).then((settings) => {
      if (
        settings.settings[0].terms_and_conditions.version.toString() !=
        localStorage.getItem(TC_VERSION_ACCEPTED)
      ) {
        this.router.navigate([this.i18nStore.activeLang, ERoutes.TERMS], {
          queryParams: { next: this.nextRoute },
        })
        return
      }
      this.service.resetState()
      this.initVisualization()
      return
    })
  }

  protected abortTest() {
    this.stopped$.next()
    this.router.navigate([this.i18nStore.activeLang, ERoutes.HOME])
  }

  protected initVisualization() {
    this.visualization$ = this.store.visualization$.pipe(
      withLatestFrom(this.mainStore.error$, this.loopCount$),
      distinctUntilChanged(),
      map(([state, error]) => {
        if (error) {
          this.openErrorDialog(state)
        } else if (state.currentPhaseName === EMeasurementStatus.END) {
          this.goToResult(state)
        }
        return state
      })
    )
    this.service.triggerNextTest()
  }

  protected openErrorDialog(state: ITestVisualizationState) {
    this.message.closeAllDialogs()
    let message = ERROR_OCCURED
    if (state.currentPhaseName === EMeasurementStatus.SUBMITTING_RESULTS) {
      message = ERROR_OCCURED_SENDING_RESULTS
    }
    this.stopped$.next()
    this.message.openConfirmDialog(message, () => {
      this.mainStore.error$.next(null)
      state.currentPhaseName === EMeasurementStatus.SUBMITTING_RESULTS
        ? this.goToResult(state)
        : this.router.navigate(["/"])
    })
  }

  protected goToResult = (state: ITestVisualizationState) => {
    this.stopped$.next()
    // Go to the result page
    this.router.navigate([this.i18nStore.activeLang, ERoutes.RESULT], {
      queryParams: {
        test_uuid: "T" + state.phases[state.currentPhaseName].testUuid,
      },
    })
  }

  @HostListener("window:beforeunload", ["$event"])
  preventReload(event: BeforeUnloadEvent) {
    event.preventDefault()
    event.returnValue = true
    return true
  }

  @HostListener("window:unload")
  unload() {
    this.service.sendAbort(this.store.basicNetworkInfo().testUuid)
  }
}
