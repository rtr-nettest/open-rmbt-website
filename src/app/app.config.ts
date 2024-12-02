import {
  ApplicationConfig,
  ChangeDetectorRef,
  provideZoneChangeDetection,
} from "@angular/core"
import { provideRouter, withComponentInputBinding } from "@angular/router"

import { routes } from "./app.routes"
import { provideClientHydration } from "@angular/platform-browser"
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async"
import { provideHttpClient, withFetch } from "@angular/common/http"
import { provideI18n } from "./modules/i18n/i18n.module"
import localeCs from "@angular/common/locales/cs"
import localeDe from "@angular/common/locales/de"
import localeEs from "@angular/common/locales/es"
import localeFr from "@angular/common/locales/fr"
import localeIt from "@angular/common/locales/it"
import { DatePipe, registerLocaleData } from "@angular/common"

export async function provideConfig(): Promise<ApplicationConfig> {
  ;[localeCs, localeDe, localeEs, localeFr, localeIt].forEach((locale) =>
    registerLocaleData(locale)
  )
  return {
    providers: [
      provideZoneChangeDetection({ eventCoalescing: true }),
      provideRouter(routes, withComponentInputBinding()),
      provideClientHydration(),
      provideAnimationsAsync(),
      provideHttpClient(withFetch()),
      await provideI18n(),
      { provide: DatePipe },
    ],
  }
}
