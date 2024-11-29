import { Component, inject, OnInit } from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { Router } from "@angular/router"
import {
  BehaviorSubject,
  distinctUntilChanged,
  map,
  Observable,
  Subject,
  tap,
  withLatestFrom,
} from "rxjs"
import { TC_VERSION } from "../terms-conditions-screen/terms-conditions-screen.component"
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
} from "../../constants/strings"
import { MessageService } from "../../../shared/services/message.service"
import { HistoryStore } from "../../store/history.store"
import { SpacerComponent } from "../../../shared/components/spacer/spacer.component"
import { GaugeComponent } from "../../components/gauge/gauge.component"
import { InterimResultsComponent } from "../../components/interim-results/interim-results.component"
import { RecentHistoryComponent } from "../../components/recent-history/recent-history.component"
import { TestService } from "../../services/test.service"

@Component({
  selector: "app-test-screen",
  standalone: true,
  imports: [
    AsyncPipe,
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
  ],
  templateUrl: "./test-screen.component.html",
  styleUrl: "./test-screen.component.scss",
})
export class TestScreenComponent extends SeoComponent implements OnInit {
  historyStore = inject(HistoryStore)
  router = inject(Router)
  message = inject(MessageService)
  service = inject(TestService)
  store = inject(TestStore)
  enableLoopMode$ = this.store.enableLoopMode$
  loopCount$ = this.store.loopCounter$
  stopped$: Subject<void> = new Subject()
  visualization$!: Observable<ITestVisualizationState>
  loopWaiting$ = new BehaviorSubject(false)
  result$ = this.historyStore.getFormattedHistory({
    grouped: false,
    loopUuid: this.store.loopUuid$.value ?? undefined,
  })
  ms$ = new BehaviorSubject(0)
  progress$ = new BehaviorSubject(0)
  progressMode$ = new BehaviorSubject<"determinate" | "indeterminate">(
    "determinate"
  )

  ngOnInit(): void {
    this.service
      .getSettings()
      .pipe(
        map((settings) => {
          if (
            globalThis.localStorage &&
            settings.settings[0].terms_and_conditions.version.toString() !=
              localStorage.getItem(TC_VERSION)
          ) {
            this.router.navigate([this.i18nStore.activeLang, ERoutes.TERMS])
            return false
          }
          this.visualization$ = this.store.visualization$.pipe(
            withLatestFrom(this.store.error$, this.loopCount$),
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
          return true
        })
      )
      .subscribe()
  }

  protected openErrorDialog(state: ITestVisualizationState) {
    this.message.closeAllDialogs()
    let message = ERROR_OCCURED
    if (state.currentPhaseName === EMeasurementStatus.SUBMITTING_RESULTS) {
      message = ERROR_OCCURED_SENDING_RESULTS
    }
    this.stopped$.next()
    this.message.openConfirmDialog(message, () => {
      this.store.error$.next(null)
      state.currentPhaseName === EMeasurementStatus.SUBMITTING_RESULTS
        ? this.goToResult(state)
        : this.router.navigate(["/"])
    })
  }

  protected goToResult = (state: ITestVisualizationState) => {
    this.router.navigate([
      this.i18nStore.activeLang,
      ERoutes.RESULT,
      state.phases[state.currentPhaseName].testUuid,
    ])
  }
}
