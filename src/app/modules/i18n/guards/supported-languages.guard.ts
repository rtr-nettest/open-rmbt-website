import { inject } from "@angular/core"
import { CanActivateFn, Router } from "@angular/router"
import { I18nStore } from "../store/i18n.store"
import { ERoutes } from "../../shared/constants/routes.enum"
import { ErrorStore } from "../../error/store/error-store.service"

export const supportedLanguagesGuard: CanActivateFn = (route, state) => {
  const i18nStore = inject(I18nStore)
  const paths = route.url.map((s) => s.path)
  if (i18nStore.availableLangs.includes(paths[0])) {
    return true
  }
  inject(ErrorStore).$originalPath.set(globalThis.location?.pathname)
  inject(Router).navigate(["en"])
  return false
}
