import { CanDeactivateFn } from "@angular/router"
import { ERoutes } from "../constants/routes.enum"

export const unloadOnlyFor: (
  allowedPaths: ERoutes[]
) => CanDeactivateFn<unknown> =
  (allowedPaths) => (component, currentRoute, currentState, nextState) => {
    if (
      nextState.url &&
      !allowedPaths.some((path) => nextState.url.includes(path))
    ) {
      globalThis.open(nextState.url, "_self")
      return false
    }
    return true
  }
