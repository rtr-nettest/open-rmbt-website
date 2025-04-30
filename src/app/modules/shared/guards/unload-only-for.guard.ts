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
    if (
      !nextState.url ||
      allowedPaths.some((path) => nextState.url.includes(path)) ||
      (testStore.visualization$.value.currentPhaseName ===
        EMeasurementStatus.ERROR &&
        !testService.isLoopModeEnabled) ||
      certifiedStore.testStartDisabled() ||
      loopStore.maxTestsReached()
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
