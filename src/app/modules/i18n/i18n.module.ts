import { Provider } from "@angular/core"
import { I18nStore, Translation } from "./store/i18n.store"
import { ILocale } from "./interfaces/locale.interface"
import { TranslationHttpLoader } from "./services/translation-http-loader"

export type I18nConfig = {
  defaultLocale: ILocale
  availableLocales: ILocale[]
  translations: Translation
}

export const provideI18n = async (): Promise<Provider> => {
  const availableLocales = await TranslationHttpLoader.getLocales()
  const defaultLocale = availableLocales.find((l) => l.code == "en")!
  const translations = await TranslationHttpLoader.getTranslations(
    defaultLocale!.code!
  )
  return {
    provide: I18nStore,
    useFactory: () => {
      const store = new I18nStore()
      store.setAvailableLocales(availableLocales)
      store.setDefaultLocale(defaultLocale)
      store.setTranslations(translations)
      return store
    },
  }
}
