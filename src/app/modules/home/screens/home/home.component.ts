import { Component, inject } from "@angular/core"
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
    TopNavComponent,
    BreadcrumbsComponent,
  ],
  templateUrl: "./home.component.html",
  styleUrl: "./home.component.scss",
})
export class HomeComponent extends SeoComponent {
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
  platform = inject(PlatformService)
}
