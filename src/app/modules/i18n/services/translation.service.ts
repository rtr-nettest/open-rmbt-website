import { Injectable } from "@angular/core"
import { I18nStore } from "../store/i18n.store"
import { ILocale } from "../interfaces/locale.interface"
import { Router } from "@angular/router"

@Injectable({
  providedIn: "root",
})
export class TranslationService {
  constructor(
    private readonly i18nStore: I18nStore,
    private readonly router: Router
  ) {}

  setLocale(locale: ILocale) {
    const paths = globalThis.location.pathname.split("/").filter(Boolean)
    const queryParams = [
      ...new URLSearchParams(globalThis.location.search).entries(),
    ].reduce((acc, [key, value]) => ({ ...acc, [key]: value }), {})
    if (paths.length == 0 || this.i18nStore.availableLangs.includes(paths[0])) {
      paths[0] = locale.code
    } else {
      paths.unshift(locale.code)
    }

    this.router.navigate(paths, { queryParams })
  }
}
