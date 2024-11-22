import { environment } from "../../../../environments/environment"
import { ILocale } from "../interfaces/locale.interface"
import defTranslations from "../../../../assets/i18n/en.json"

export class TranslationHttpLoader {
  static async getLocales() {
    let availableLocales: ILocale[] = [
      {
        code: "en",
        name: "English",
      },
    ]
    try {
      availableLocales = await (
        await fetch(`${environment.baseUrl}/assets/available-locales.json`)
      ).json()
    } catch (_) {}
    return availableLocales
  }

  static async getTranslations(lang: string): Promise<{ [key: string]: any }> {
    try {
      const localTranslations = await (
        await fetch(`${environment.baseUrl}/assets/i18n/${lang}.json`)
      ).json()
      return localTranslations
    } catch (_) {
      return defTranslations
    }
  }

  static async getLocalizedHtml(name: string, lang: string) {
    try {
      const text = await (
        await fetch(
          `${environment.baseUrl}/assets/html/${name}/${name}.${lang}.html`
        )
      ).text()
      return text
    } catch (_) {
      return ""
    }
  }
}
