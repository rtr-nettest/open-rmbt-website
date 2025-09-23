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
import { patchToLocaleString } from "./modules/shared/util/number"
import {
  MATOMO_PAGE_URL_PROVIDER,
  provideMatomo,
  withRouter,
} from "ngx-matomo-client"
import { environment } from "../environments/environment"
import { MatomoUrlProviderService } from "./modules/shared/services/matomo-url-provider.service"

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

patchToLocaleString()

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
      ...(environment.matomo
        ? [
            provideMatomo(
              { ...environment.matomo, requireConsent: "cookie" },
              withRouter()
            ),
            {
              provide: MATOMO_PAGE_URL_PROVIDER,
              useClass: MatomoUrlProviderService,
            },
          ]
        : []),
    ],
  }
}
