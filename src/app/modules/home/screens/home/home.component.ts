import { AfterViewInit, Component, inject } from "@angular/core"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import {
  concatMap,
  interval,
  map,
  Observable,
  of,
  startWith,
  takeUntil,
} from "rxjs"
import { AsyncPipe } from "@angular/common"
import { CardButtonComponent } from "../../components/card-button/card-button.component"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { IpInfoComponent } from "../../components/ip-info/ip-info.component"
import {
  EPlatform,
  PlatformService,
} from "../../../shared/services/platform.service"
import { MeasurementsService } from "../../services/measurements.service"
import { MapComponent } from "../../components/map/map.component"
import { IRecentMeasurementsResponse } from "../../interfaces/recent-measurements-response.interface"

const UPDATE_INTERVAL = 3000

@Component({
  selector: "app-landing",
  standalone: true,
  imports: [
    AsyncPipe,
    BreadcrumbsComponent,
    CardButtonComponent,
    HeaderComponent,
    IpInfoComponent,
    FooterComponent,
    MapComponent,
    TopNavComponent,
    BreadcrumbsComponent,
  ],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent extends SeoComponent implements AfterViewInit {
  mapContainerId = "mapContainer"
  text$: Observable<string> = this.i18nStore.getLocalizedHtml("home")
  appLinksText$: Observable<string> = this.i18nStore.getTranslations().pipe(
    map((t) => {
      let text = t[`Download $ios, $android or $desktop or conduct $web.`]
      const platform = this.platform.detectPlatform()
      if (
        new Set([EPlatform.ANDROID, EPlatform.IOS, EPlatform.WIN_PHONE]).has(
          platform
        )
      ) {
        // We're on mobile, no reason to show the desktop links
        text = t[`Download $ios or $androidApp or conduct $web.`]
      }
      text = text.replace("$ios", t["iOS link"])
      text = text.replace("$androidApp", t["AndroidApp link"])
      text = text.replace("$android", t["Android link"])
      if (platform == EPlatform.LINUX) {
        text = text.replace("$desktop", t["Linux link"])
      } else if (platform == EPlatform.MAC) {
        text = text.replace("$desktop", t["Mac link"])
      } else if (platform == EPlatform.WINDOWS) {
        text = text.replace("$desktop", t["Windows link"])
      } else {
        text = text.replace("$desktop", t["Other desktop app link"])
      }
      text = text.replace("$web", t["Browser test link"])
      return text
    })
  )
  eRoutes = ERoutes
  measurements = inject(MeasurementsService)
  platform = inject(PlatformService)
  recentMeasurements$: Observable<IRecentMeasurementsResponse | null> = of(null)

  ngAfterViewInit(): void {
    if (globalThis.document) {
      this.recentMeasurements$ = interval(UPDATE_INTERVAL).pipe(
        startWith(this.measurements.getRecentMeasurements()),
        takeUntil(this.destroyed$),
        concatMap(() => this.measurements.getRecentMeasurements())
      )
    }
  }
}
