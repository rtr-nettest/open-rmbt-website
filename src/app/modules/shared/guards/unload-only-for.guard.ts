import { CanDeactivateFn } from "@angular/router"
import { ERoutes } from "../constants/routes.enum"
import { inject } from "@angular/core"
import { MatDialog } from "@angular/material/dialog"
import { ConfirmDialogComponent } from "../components/confirm-dialog/confirm-dialog.component"
import { ScrollStrategyOptions } from "@angular/cdk/overlay"
import { map } from "rxjs"

export const unloadOnlyFor: (
  allowedPaths: ERoutes[]
) => CanDeactivateFn<unknown> =
  (allowedPaths) => (component, currentRoute, currentState, nextState) => {
    const dialog = inject(MatDialog)
    const scrollStrategyOptions = inject(ScrollStrategyOptions)
    if (
      nextState.url &&
      !allowedPaths.some((path) => nextState.url.includes(path))
    ) {
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
              setTimeout(() => {
                location.reload()
              }, 30)
            }
            return proceed
          })
        )
    }
    return true
  }
