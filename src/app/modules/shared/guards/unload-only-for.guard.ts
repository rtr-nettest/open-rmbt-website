import { CanDeactivateFn } from "@angular/router"
import { ERoutes } from "../constants/routes.enum"
import { MainStore } from "../store/main.store"
import { inject } from "@angular/core"

export const unloadOnlyFor: (
  allowedPaths: ERoutes[]
) => CanDeactivateFn<unknown> =
  (allowedPaths) => (component, currentRoute, currentState, nextState) => {
    const mainStore = inject(MainStore)
    if (
      nextState.url &&
      !allowedPaths.some((path) => nextState.url.includes(path))
    ) {
      if (mainStore.routingEvent() === "popstate") {
        history.replaceState({ obsolete: true }, "", currentState.url)
      }
      globalThis.open(nextState.url, "_self")
      return false
    }
    return true
  }
