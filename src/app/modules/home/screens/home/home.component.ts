import { AfterViewInit, Component, signal } from "@angular/core"
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
import { MeasurementsService } from "../../services/measurements.service"
import { MapComponent } from "../../components/map/map.component"
import {
  IRecentMeasurement,
  IRecentMeasurementsResponse,
} from "../../interfaces/recent-measurements-response.interface"
import { TableComponent } from "../../../tables/components/table/table.component"
import { ITableColumn } from "../../../tables/interfaces/table-column.interface"
import dayjs from "dayjs"
import { IBasicResponse } from "../../../tables/interfaces/basic-response.interface"
import { roundToSignificantDigits } from "../../../shared/util/math"
import { Title } from "@angular/platform-browser"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatButtonModule } from "@angular/material/button"
import { RouterModule } from "@angular/router"

const UPDATE_INTERVAL = 5000

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
  recentMeasurements = signal<IRecentMeasurementsResponse | null>(null)
  tableColumns: ITableColumn<IRecentMeasurement>[] = [
    {
      columnDef: "time",
      header: "Time",
      isHtml: true,
      transformValue(value) {
        const retVal = dayjs(value.time)
          .utc()
          .tz(dayjs.tz.guess())
          .format("HH:mm:ss")
        return `<i class="app-icon app-icon--browser"></i><span>${retVal}</span>`
      },
    },
    {
      columnDef: "platform",
      header: "Provider/device",
      isHtml: true,
      transformValue(value) {
        const retVal = `${value.provider_name}, ${value.model} (${value.platform})`
        return `<i class="app-icon app-icon--marker"></i><span>${retVal}</span>`
      },
    },
    {
      columnDef: "download",
      header: "Down (Mbps)",
      transformValue: (value) => {
        return roundToSignificantDigits(value.download_kbit / 1000)
      },
      justify: "flex-end",
    },
    {
      columnDef: "upload",
      header: "Up (Mbps)",
      transformValue: (value) => {
        return roundToSignificantDigits(value.upload_kbit / 1000)
      },
      justify: "flex-end",
    },
    {
      columnDef: "ping",
      header: "Ping (ms)",
      transformValue: (value) => {
        return Math.round(value.ping_ms)
      },
      justify: "flex-end",
    },
  ]
  tableData = signal<IBasicResponse<IRecentMeasurement> | null>(null)

  constructor(
    i18nStore: I18nStore,
    title: Title,
    private readonly measurements: MeasurementsService,
    private readonly platform: PlatformService
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

  private setMeasurements() {
    firstValueFrom(this.measurements.getRecentMeasurements()).then((resp) => {
      const content = resp?.results.reverse().slice(0, 5) ?? []
      this.tableData.set({
        content,
        totalElements: content.length,
      })
      this.recentMeasurements.set(resp)
    })
  }
}
