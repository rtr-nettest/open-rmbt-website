import { Injectable, inject } from "@angular/core"
import { I18nStore } from "../../i18n/store/i18n.store"
import { ActivatedRouteSnapshot } from "@angular/router"
import { map, switchMap } from "rxjs"

@Injectable({ providedIn: "root" })
export class LocaleResolver {
  constructor(private readonly _i18nStore: I18nStore) {}

  resolve(activeRoute: ActivatedRouteSnapshot) {
    return this._i18nStore.getLocales().pipe(
      switchMap((locales) => {
        const lang = activeRoute.params["lang"]
        const locale = locales.find((l) => l.code == lang)
        if (locale) {
          return this._i18nStore.setActiveLocale(locale)
        } else {
          return this._i18nStore.setActiveLocale(this._i18nStore.defaultLocale!)
        }
      })
    )
  }
}

export const localeResolver = (activeRoute: ActivatedRouteSnapshot) =>
  inject(LocaleResolver).resolve(activeRoute)
