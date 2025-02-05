import {
  AfterViewInit,
  Component,
  HostListener,
  inject,
  NgZone,
  OnInit,
} from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { Router } from "@angular/router"
import {
  BehaviorSubject,
  distinctUntilChanged,
  firstValueFrom,
  map,
  Observable,
  of,
  Subject,
  switchMap,
  takeUntil,
  withLatestFrom,
} from "rxjs"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { AsyncPipe, DatePipe, NgIf } from "@angular/common"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { TestStore } from "../../store/test.store"
import { EMeasurementStatus } from "../../constants/measurement-status.enum"
import { ITestVisualizationState } from "../../interfaces/test-visualization-state.interface"
import {
  ERROR_OCCURED,
  ERROR_OCCURED_SENDING_RESULTS,
  TC_VERSION_ACCEPTED,
  THIS_INTERRUPTS_ACTION,
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
import { setGoBackLocation } from "../../../shared/util/nav"
import { SprintfPipe } from "../../../shared/pipes/sprintf.pipe"
import { SettingsService } from "../../../shared/services/settings.service"

export const imports = [
  AsyncPipe,
  BreadcrumbsComponent,
  DatePipe,
  HeaderComponent,
  FooterComponent,
  GaugeComponent,
  InterimResultsComponent,
  MatProgressBarModule,
  NgIf,
  RecentHistoryComponent,
  TopNavComponent,
  TranslatePipe,
  SpacerComponent,
  SprintfPipe,
  BreadcrumbsComponent,
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
  goBackLocation = `/${this.i18nStore.activeLang}/${ERoutes.HOME}`
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
  loopWaiting$ = new BehaviorSubject(false)
  result$ = this.historyService.getHistoryGroupedByLoop({
    grouped: false,
    loopUuid: this.loopStore.loopUuid(),
  })
  ms$ = new BehaviorSubject(0)
  progress$ = new BehaviorSubject(0)
  progressMode$ = new BehaviorSubject<"determinate" | "indeterminate">(
    "determinate"
  )

  ngOnInit(): void {
    if (!globalThis.localStorage) {
      return
    }
    firstValueFrom(this.settingsService.getSettings()).then((settings) => {
      if (
        settings.settings[0].terms_and_conditions.version.toString() !=
        localStorage.getItem(TC_VERSION_ACCEPTED)
      ) {
        this.router.navigate([this.i18nStore.activeLang, ERoutes.TERMS])
        return
      }
      this.service.resetState()
      setGoBackLocation(this.goBackLocation)
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

  @HostListener("window:beforeunload")
  preventReload() {
    return false
  }
}
