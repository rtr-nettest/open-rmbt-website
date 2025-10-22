import { Component, inject } from "@angular/core"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { SitemapService } from "../../services/sitemap.service"
import { MainContentComponent } from "../../../shared/components/main-content/main-content.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { AsyncPipe, NgTemplateOutlet } from "@angular/common"
import { RouterModule } from "@angular/router"

@Component({
  selector: "app-sitemap",
  imports: [
    AsyncPipe,
    BreadcrumbsComponent,
    HeaderComponent,
    TopNavComponent,
    MainContentComponent,
    FooterComponent,
    RouterModule,
    TranslatePipe,
    NgTemplateOutlet,
  ],
  templateUrl: "./sitemap.component.html",
  styleUrl: "./sitemap.component.scss",
})
export class SitemapComponent extends SeoComponent {
  sitemap$ = inject(SitemapService).getSitemap(this.i18nStore.activeLang)
}
