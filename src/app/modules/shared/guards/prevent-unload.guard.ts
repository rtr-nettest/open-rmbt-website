import { CanDeactivateFn } from "@angular/router"

export const preventUnloadGuard: CanDeactivateFn<unknown> = (
  component,
  currentRoute,
  currentState,
  nextState
) => {
  if (nextState.url) {
    globalThis.open(nextState.url, "_self")
  }
  return false
}
