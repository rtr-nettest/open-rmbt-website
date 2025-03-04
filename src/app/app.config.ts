import { ApplicationConfig, provideZoneChangeDetection } from "@angular/core"
import { provideRouter, withComponentInputBinding } from "@angular/router"

import { routes } from "./app.routes"
import { provideClientHydration } from "@angular/platform-browser"
import { provideAnimationsAsync } from "@angular/platform-browser/animations/async"
import {
  provideHttpClient,
  withFetch,
  withInterceptors,
} from "@angular/common/http"
import { provideI18n } from "./modules/i18n/i18n.module"
import localeCs from "@angular/common/locales/cs"
import localeDe from "@angular/common/locales/de"
import localeEs from "@angular/common/locales/es"
import localeFr from "@angular/common/locales/fr"
import localeIt from "@angular/common/locales/it"
import { DatePipe, registerLocaleData } from "@angular/common"
import {
  BarController,
  BarElement,
  CategoryScale,
  Chart,
  Filler,
  LinearScale,
  LineController,
  LineElement,
  PointElement,
  TimeScale,
} from "chart.js"
import "chartjs-adapter-dayjs-4/dist/chartjs-adapter-dayjs-4.esm"
import { errorInterceptor } from "./modules/shared/interceptors/error.interceptor"
import { LonlatPipe } from "./modules/shared/pipes/lonlat.pipe"

Chart.register(
  BarElement,
  BarController,
  LineElement,
  PointElement,
  LineController,
  CategoryScale,
  LinearScale,
  TimeScale,
  Filler
)

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
      provideHttpClient(withFetch(), withInterceptors([errorInterceptor])),
      await provideI18n(),
      { provide: DatePipe },
      { provide: LonlatPipe },
    ],
  }
}
