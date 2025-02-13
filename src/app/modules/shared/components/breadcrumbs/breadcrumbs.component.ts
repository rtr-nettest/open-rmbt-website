import { Component } from "@angular/core"
import {
  ActivatedRoute,
  Route,
  RouterModule,
  Routes,
  UrlSegment,
} from "@angular/router"
import { ILink } from "../../interfaces/link.interface"
import { map, Observable, withLatestFrom } from "rxjs"
import { AsyncPipe } from "@angular/common"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { ERoutes } from "../../constants/routes.enum"
import { routes } from "../../../../app.routes"

@Component({
    selector: "app-breadcrumbs",
    imports: [AsyncPipe, RouterModule],
    templateUrl: "./breadcrumbs.component.html",
    styleUrl: "./breadcrumbs.component.scss"
})
export class BreadcrumbsComponent {
  breadcrumbs$!: Observable<ILink[]>

  constructor(
    private readonly activatedRoute: ActivatedRoute,
    private readonly i18nStore: I18nStore
  ) {
    this.breadcrumbs$ = this.i18nStore.getTranslations().pipe(
      withLatestFrom(this.activatedRoute.url),
      map(([t, segments]) => {
        let retVal = [
          {
            label: t["Home"],
            route: `/${this.i18nStore.activeLang}/${ERoutes.HOME}`,
          },
        ]
        if (!segments.length) {
          return retVal
        }
        const flatRoutes = this.flattenRoutes(routes)
        return [
          ...retVal,
          ...segments
            .map((s: UrlSegment) => {
              const route = flatRoutes.get(s.path)
              if (route) {
                return {
                  label: t[route.data?.["title"]] || route.data?.["title"],
                  route: `/${this.i18nStore.activeLang}/${s.path}`,
                }
              }
              return null
            })
            .filter((v) => v != null),
        ]
      })
    )
  }

  flattenRoutes = (
    routes: Routes,
    flatRoutes: Map<string, Route> = new Map()
  ) => {
    for (const route of routes) {
      flatRoutes.set(route.path!, route)
      if (route.children?.length) {
        this.flattenRoutes(route.children, flatRoutes)
      }
    }
    return flatRoutes
  }
}
