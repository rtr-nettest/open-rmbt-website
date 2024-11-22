import { Routes } from "@angular/router"
import { ERoutes } from "./modules/shared/constants/routes.enum"
import { localeResolver } from "./modules/i18n/resolvers/locale.resolver"
import { supportedLanguagesGuard } from "./modules/i18n/guards/supported-languages.guard"
import { HomeComponent } from "./modules/home/screens/home/home.component"
import { PageNotFoundComponent } from "./modules/error/screens/page-not-found/page-not-found.component"

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
