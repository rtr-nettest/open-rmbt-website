import {
  AfterViewInit,
  Component,
  computed,
  HostListener,
  inject,
  signal,
} from "@angular/core"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { map, Observable } from "rxjs"
import { AsyncPipe } from "@angular/common"
import { CardButtonComponent } from "../../components/card-button/card-button.component"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { IpInfoComponent } from "../../components/ip-info/ip-info.component"
import {
  EPlatform,
  PlatformService,
} from "../../../shared/services/platform.service"
import { MapComponent } from "../../../map/components/map/map.component"
import { IRecentMeasurement } from "../../../opendata/interfaces/recent-measurements-response.interface"
import { TableComponent } from "../../../tables/components/table/table.component"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatButtonModule } from "@angular/material/button"
import { Router, RouterModule } from "@angular/router"
import { RECENT_MEASUREMENTS_COLUMNS } from "../../../opendata/constants/recent-measurements-columns"
import { FullscreenControl, NavigationControl } from "maplibre-gl"
import { FullScreenService } from "../../../map/services/full-screen.service"
import { MainContentComponent } from "../../../shared/components/main-content/main-content.component"
import { LiveService } from "../../../opendata/services/live.service"

@Component({
  selector: "app-landing",
  imports: [
    AsyncPipe,
    BreadcrumbsComponent,
    CardButtonComponent,
    HeaderComponent,
    IpInfoComponent,
    FooterComponent,
    MainContentComponent,
    MapComponent,
    MatButtonModule,
    RouterModule,
    TopNavComponent,
    BreadcrumbsComponent,
    TableComponent,
    TranslatePipe,
  ],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent extends SeoComponent implements AfterViewInit {
  mapContainerId = "mapContainer"
  mapControls = [new NavigationControl(), new FullscreenControl()]
  text$: Observable<string> = this.i18nStore.getLocalizedHtml("home")
  appLinksText$: Observable<string> = this.i18nStore.getTranslations().pipe(
    map((t) => {
      let text = t[`Download %ios, %android or %desktop or conduct %web.`]
      const platform = this.platform.detectPlatform()
      if (
        new Set([EPlatform.ANDROID, EPlatform.IOS, EPlatform.WIN_PHONE]).has(
          platform,
        )
      ) {
        // We're on mobile, no reason to show the desktop links
        text = t[`Download %ios or %androidApp or conduct %web.`]
      }
      text = text.replace("%ios", t["iOS link"])
      text = text.replace("%androidApp", t["AndroidApp link"])
      text = text.replace("%android", t["Android link"])
      if (platform == EPlatform.LINUX) {
        text = text.replace("%desktop", t["Linux link"])
      } else if (platform == EPlatform.MAC) {
        text = text.replace("%desktop", t["Mac link"])
      } else if (platform == EPlatform.WINDOWS) {
        text = text.replace("%desktop", t["Windows link"])
      } else {
        text = text.replace("%desktop", t["Other desktop app link"])
      }
      text = text.replace("%web", t["Browser test link"])
      return text
    }),
  )
  eRoutes = ERoutes
  liveService = inject(LiveService)
  recentMeasurements = this.liveService.recentMeasurements
  tableColumns: ITableColumn<IRecentMeasurement>[] = RECENT_MEASUREMENTS_COLUMNS
  tableData = this.liveService.tableData
  mapDisabled = signal(false)
  mobileLink = computed(() => {
    const platform = this.platform.detectPlatform()
    if (platform === EPlatform.ANDROID) {
      return this.i18nStore.translate("Android app href")
    } else if (platform === EPlatform.IOS) {
      return this.i18nStore.translate("iOS app href")
    }
    return null
  })
  platform = inject(PlatformService)
  router = inject(Router)
  private fullScreen = inject(FullScreenService)

  ngAfterViewInit(): void {
    if (globalThis.document) {
      this.liveService.watchMeasurements()
      const testCard = document.querySelector(
        `a[href*="${ERoutes.TEST}"].app-card`,
      ) as HTMLAnchorElement
      testCard.focus()
    }
  }

  override ngOnDestroy(): void {
    super.ngOnDestroy()
    this.liveService.watchMeasurements(false)
  }

  goToResult(result: IRecentMeasurement) {
    this.router.navigate([this.i18nStore.activeLang, ERoutes.OPEN_RESULT], {
      queryParams: {
        open_test_uuid: result.open_test_uuid,
      },
    })
  }

  @HostListener("document:keypress", ["$event"])
  handleKeyDown(event: KeyboardEvent) {
    if (event.key === "m") {
      this.fullScreen.toggleFullScreen()
    } else if (event.key === "o") {
      this.router.navigate([this.i18nStore.activeLang, ERoutes.OPEN_DATA])
    } else if (event.key === "s") {
      this.router.navigate([this.i18nStore.activeLang, ERoutes.TEST])
    } else if (event.key === "t") {
      const skipLink = document.getElementById("skipLink")
      if (skipLink) {
        skipLink.focus()
      }
    }
  }
}
