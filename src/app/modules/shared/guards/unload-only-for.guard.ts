import { CanDeactivateFn } from "@angular/router"
import { ERoutes } from "../constants/routes.enum"
import { inject } from "@angular/core"
import { MatDialog } from "@angular/material/dialog"
import { ConfirmDialogComponent } from "../components/confirm-dialog/confirm-dialog.component"
import { ScrollStrategyOptions } from "@angular/cdk/overlay"
import { map } from "rxjs"
import { TestService } from "../../test/services/test.service"
import { TestStore } from "../../test/store/test.store"
import { EMeasurementStatus } from "../../test/constants/measurement-status.enum"
import { CertifiedStoreService } from "../../certified/store/certified-store.service"
import { LoopStoreService } from "../../loop/store/loop-store.service"
import { ConnectivityService } from "../../test/services/connectivity.service"

export const unloadOnlyFor: (
  allowedPaths: ERoutes[]
) => CanDeactivateFn<unknown> =
  (allowedPaths) => (component, currentRoute, currentState, nextState) => {
    const dialog = inject(MatDialog)
    const scrollStrategyOptions = inject(ScrollStrategyOptions)
    const testStore = inject(TestStore)
    const testService = inject(TestService)
    const certifiedStore = inject(CertifiedStoreService)
    const loopStore = inject(LoopStoreService)
    const connectivity = inject(ConnectivityService)
    if (
      !nextState.url ||
      // Don't show dialog when it is allowed for the next state
      allowedPaths.some((path) => nextState.url.includes(path)) ||
      // Don't show dialog when there's an error
      (testStore.visualization$.value.currentPhaseName ===
        EMeasurementStatus.ERROR &&
        !testService.isLoopModeEnabled) ||
      // Don't show dialog when it is a certified measurement and a tab is accessed out of order
      (loopStore.isCertifiedMeasurement() && !certifiedStore.isReady()) ||
      // Don't show dialog when it is a certified or loop measurement and a tab is accessed out of order
      ((allowedPaths.includes(ERoutes.CERTIFIED_RESULT) ||
        allowedPaths.includes(ERoutes.LOOP_RESULT)) &&
        loopStore.activeBreadcrumbIndex() == null &&
        certifiedStore.activeBreadcrumbIndex() == null) ||
      // Don't show dialog when it is a loop measurement and the test is finished
      loopStore.maxTestsReached() ||
      // Don't show dialog when we're offline
      !connectivity.isOnline()
    ) {
      return true
    }
    return dialog
      .open(ConfirmDialogComponent, {
        data: {
          text: "Are you sure you want to leave this page? The data may be lost as a result.",
          canCancel: true,
        },
        scrollStrategy: scrollStrategyOptions.noop(),
      })
      .afterClosed()
      .pipe(
        map((result) => {
          const proceed = result?.confirmAction === true
          if (proceed) {
            testStore.shouldAbort.set(true)
            testService.sendAbort(testStore.basicNetworkInfo().testUuid)
          }
          return proceed
        })
      )
  }
