import { Routes } from "@angular/router"
import { ERoutes } from "./modules/shared/constants/routes.enum"
import { localeResolver } from "./modules/i18n/resolvers/locale.resolver"
import { supportedLanguagesGuard } from "./modules/i18n/guards/supported-languages.guard"
import { HomeComponent } from "./modules/home/screens/home/home.component"
import { PageNotFoundComponent } from "./modules/error/screens/page-not-found/page-not-found.component"
import { TermsConditionsScreenComponent } from "./modules/test/screens/terms-conditions-screen/terms-conditions-screen.component"
import { TestScreenComponent } from "./modules/test/screens/test-screen/test-screen.component"
import { MapScreenComponent } from "./modules/map/screens/map-screen/map-screen.component"
import { StatisticsScreenComponent } from "./modules/statistics/screens/statistics-screen/statistics-screen.component"
import { ResultScreenComponent } from "./modules/history/screens/result-screen/result-screen.component"
import { HistoryScreenComponent } from "./modules/history/screens/history-screen/history-screen.component"
import { Step1Component } from "./modules/certified/screens/step-1/step-1.component"
import { Step2Component } from "./modules/certified/screens/step-2/step-2.component"
import { Step3Component } from "./modules/certified/screens/step-3/step-3.component"

export const routes: Routes = [
  {
    path: ERoutes.HOME,
    pathMatch: "full",
    redirectTo: "/en",
  },
  {
    path: ":lang",
    canActivate: [supportedLanguagesGuard],
    children: [
      {
        path: ERoutes.HOME,
        pathMatch: "full",
        component: HomeComponent,
        resolve: [localeResolver],
        data: {
          title: "Home",
        },
      },
      {
        path: ERoutes.TERMS,
        pathMatch: "full",
        component: TermsConditionsScreenComponent,
        resolve: [localeResolver],
        data: {
          title: "Privacy Policy and Terms of Use",
        },
      },
      {
        path: ERoutes.TEST,
        pathMatch: "full",
        component: TestScreenComponent,
        resolve: [localeResolver],
        data: {
          title: "Test",
        },
      },
      {
        path: ERoutes.MAP,
        pathMatch: "full",
        component: MapScreenComponent,
        resolve: [localeResolver],
        data: {
          title: "Map view",
        },
      },
      {
        path: ERoutes.STATISTICS,
        pathMatch: "full",
        component: StatisticsScreenComponent,
        resolve: [localeResolver],
        data: {
          title: "Statistics",
        },
      },
      {
        path: ERoutes.RESULT,
        pathMatch: "full",
        component: ResultScreenComponent,
        resolve: [localeResolver],
        data: {
          title: "History",
        },
      },
      {
        path: ERoutes.HISTORY,
        pathMatch: "full",
        component: HistoryScreenComponent,
        resolve: [localeResolver],
        data: {
          title: "History",
        },
      },
      {
        path: ERoutes.CERTIFIED,
        pathMatch: "full",
        component: Step1Component,
        resolve: [localeResolver],
        data: {
          title: "Certified measurement",
        },
      },
      {
        path: ERoutes.CERTIFIED_2,
        pathMatch: "full",
        component: Step2Component,
        resolve: [localeResolver],
        data: {
          title: "Certified measurement",
        },
      },
      {
        path: ERoutes.CERTIFIED_3,
        pathMatch: "full",
        component: Step3Component,
        resolve: [localeResolver],
        data: {
          title: "Certified measurement",
        },
      },
      {
        path: ERoutes.PAGE_NOT_FOUND,
        pathMatch: "full",
        component: PageNotFoundComponent,
        resolve: [localeResolver],
        data: {
          title: "Page Not Found",
        },
      },
      {
        path: "**",
        component: PageNotFoundComponent,
        resolve: [localeResolver],
        data: {
          title: "Page Not Found",
        },
      },
    ],
  },
]
