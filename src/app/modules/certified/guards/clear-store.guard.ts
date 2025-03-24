import { CanDeactivateFn } from "@angular/router"
import { ERoutes } from "../../shared/constants/routes.enum"
import { inject } from "@angular/core"
import { CertifiedStoreService } from "../store/certified-store.service"

export const clearStoreGuard: CanDeactivateFn<unknown> = (
  component,
  currentRoute,
  currentState,
  nextState
) => {
  const store = inject(CertifiedStoreService)
  const keepForPaths = [
    ERoutes.CERTIFIED_1,
    ERoutes.CERTIFIED_2,
    ERoutes.CERTIFIED_3,
    ERoutes.CERTIFIED_4,
    ERoutes.CERTIFIED_RESULT,
  ]
  if (
    nextState.url &&
    !keepForPaths.some((path) => nextState.url.includes(path))
  ) {
    store.reset()
  }
  return true
}
