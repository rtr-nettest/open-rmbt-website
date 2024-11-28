import { inject, Injectable } from "@angular/core"
import {
  BehaviorSubject,
  catchError,
  from,
  map,
  of,
  switchMap,
  tap,
} from "rxjs"
import { TranslationHttpLoader } from "../services/translation-http-loader"
import { ILocale } from "../interfaces/locale.interface"

export type Translation = { [key: string]: string }

@Injectable({ providedIn: "root" })
export class I18nStore {
  private _availableLocales$ = new BehaviorSubject<ILocale[]>([])
  private _defaultLocale$ = new BehaviorSubject<ILocale | null>(null)
  private _activeLocale$ = new BehaviorSubject<ILocale | null>(null)
  private _translations$ = new BehaviorSubject<Translation>({})

  get availableLangs() {
    return this.availableLocales.map((l) => l.code)
  }

  get availableLocales() {
    return this._availableLocales$.value
  }

  get defaultLang() {
    return this.defaultLocale?.code ?? ""
  }

  get defaultLocale() {
    return this._defaultLocale$.value
  }
  get activeLang() {
    return this.activeLocale?.code ?? ""
  }

  get activeLocale() {
    return this._activeLocale$.value
  }

  get translations() {
    return this._translations$.value
  }

  getLocales() {
    return this._availableLocales$.asObservable()
  }

  getLocalizedHtml(name: string) {
    return this._activeLocale$.pipe(
      switchMap((locale) => {
        return TranslationHttpLoader.getLocalizedHtml(name, locale!.code)
      })
    )
  }

  getTranslations() {
    return this._translations$.asObservable()
  }

  setDefaultLocale(locale: ILocale) {
    this._defaultLocale$.next(locale)
  }

  setAvailableLocales(locales: ILocale[]) {
    this._availableLocales$.next(locales)
  }

  setTranslations(translations: Translation) {
    this._translations$.next(translations)
  }

  setActiveLocale(locale: ILocale) {
    return from(TranslationHttpLoader.getTranslations(locale.code)).pipe(
      tap((translations) => {
        this._activeLocale$.next(locale)
        this._translations$.next(translations)
      })
    )
  }

  translate(text: string) {
    return this.translations[text] || text
  }
}
