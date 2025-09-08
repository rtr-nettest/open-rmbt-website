import {
  AfterViewInit,
  Component,
  computed,
  inject,
  signal,
} from "@angular/core"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { firstValueFrom, interval, map, Observable, takeUntil } from "rxjs"
import { AsyncPipe } from "@angular/common"
import { CardButtonComponent } from "../../components/card-button/card-button.component"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { IpInfoComponent } from "../../components/ip-info/ip-info.component"
import {
  EPlatform,
  PlatformService,
} from "../../../shared/services/platform.service"
import { MapComponent } from "../../../opendata/components/map/map.component"
import { IRecentMeasurement } from "../../../opendata/interfaces/recent-measurements-response.interface"
import { TableComponent } from "../../../tables/components/table/table.component"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import { IBasicResponse } from "../../../tables/interfaces/basic-response.interface"
import { Title } from "@angular/platform-browser"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatButtonModule } from "@angular/material/button"
import { Router, RouterModule } from "@angular/router"
import { OpendataService } from "../../../opendata/services/opendata.service"
import { RECENT_MEASUREMENTS_COLUMNS } from "../../../opendata/constants/recent-measurements-columns"
import { FullscreenControl, NavigationControl } from "maplibre-gl"
import { formatTime } from "../../../shared/adapters/app-date.adapter"

const UPDATE_INTERVAL = 5000

@Component({
  selector: "app-landing",
  imports: [
    AsyncPipe,
    BreadcrumbsComponent,
    CardButtonComponent,
    HeaderComponent,
    IpInfoComponent,
    FooterComponent,
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
          platform
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
    })
  )
  eRoutes = ERoutes
  recentMeasurements = signal<IRecentMeasurement[]>([])
  opendataService = inject(OpendataService)
  tableColumns: ITableColumn<IRecentMeasurement>[] = RECENT_MEASUREMENTS_COLUMNS
  tableData = signal<IBasicResponse<IRecentMeasurement> | null>(null)
  mobileLink = computed(() => {
    const platform = this.platform.detectPlatform()
    if (platform === EPlatform.ANDROID) {
      return this.i18nStore.translate("Android app href")
    } else if (platform === EPlatform.IOS) {
      return this.i18nStore.translate("iOS app href")
    }
    return null
  })

  constructor(
    i18nStore: I18nStore,
    title: Title,
    private readonly measurements: OpendataService,
    private readonly platform: PlatformService,
    private readonly router: Router
  ) {
    super(title, i18nStore)
  }

  ngAfterViewInit(): void {
    if (globalThis.document) {
      this.setMeasurements()
      interval(UPDATE_INTERVAL)
        .pipe(takeUntil(this.destroyed$))
        .subscribe(() => {
          this.setMeasurements()
        })
      const testCard = document.querySelector(
        `a[href*="${ERoutes.TEST}"]`
      ) as HTMLAnchorElement
      testCard.focus()
    }
  }

  goToResult(result: IRecentMeasurement) {
    this.router.navigate([this.i18nStore.activeLang, ERoutes.OPEN_RESULT], {
      queryParams: {
        open_test_uuid: result.open_test_uuid,
      },
    })
  }

  private setMeasurements() {
    firstValueFrom(this.measurements.getRecentMeasurements()).then((resp) => {
      const content = (resp?.results ?? []).map((r) => formatTime(r))
      this.tableData.set({
        content: content.slice(0, 5),
        totalElements: content.length,
      })
      this.recentMeasurements.set(
        content.filter((m) => m.lat && m.long).slice(0, 20)
      )
    })
  }
}
