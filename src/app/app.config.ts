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
import {
  MAT_RIPPLE_GLOBAL_OPTIONS,
  RippleGlobalOptions,
} from "@angular/material/core"

const globalRippleConfig: RippleGlobalOptions = {
  disabled: true,
  animation: {
    enterDuration: 0,
    exitDuration: 0,
  },
}

export async function provideConfig(): Promise<ApplicationConfig> {
  return {
    providers: [
      provideZoneChangeDetection({ eventCoalescing: true }),
      provideRouter(routes, withComponentInputBinding()),
      provideClientHydration(),
      provideAnimationsAsync(),
      provideHttpClient(withFetch()),
      await provideI18n(),
      // { provide: MAT_RIPPLE_GLOBAL_OPTIONS, useValue: globalRippleConfig },
    ],
  }
}
