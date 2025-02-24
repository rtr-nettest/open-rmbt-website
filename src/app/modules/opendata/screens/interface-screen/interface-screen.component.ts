import { Component, computed, inject, model } from "@angular/core"
import { HtmlWrapperComponent } from "../../../shared/components/html-wrapper/html-wrapper.component"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { AsyncPipe } from "@angular/common"
import { MatSelectModule } from "@angular/material/select"
import { MatOptionModule } from "@angular/material/core"
import { pad } from "../../../shared/util/string"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
} from "@angular/forms"
import { MainStore } from "../../../shared/store/main.store"
import { map } from "rxjs"

@Component({
  selector: "app-interface-screen",
  imports: [
    AsyncPipe,
    BreadcrumbsComponent,
    HeaderComponent,
    HtmlWrapperComponent,
    MatSelectModule,
    MatOptionModule,
    TopNavComponent,
    TranslatePipe,
    FooterComponent,
    ReactiveFormsModule,
  ],
  templateUrl: "./interface-screen.component.html",
  styleUrl: "./interface-screen.component.scss",
})
export class InterfaceScreenComponent extends SeoComponent {
  mainStore = inject(MainStore)
  text$ = this.i18nStore.getLocalizedHtml("interface").pipe(
    map((html) => {
      return html.replace(
        /{{\s*url_web_statistic_server\s*}}/g,
        this.mainStore.api().url_web_statistic_server ?? ""
      )
    })
  )
  options = computed(() => {
    const startY = 2013
    const now = new Date()
    const retVal: [string, string][] = []
    while (now.getFullYear() >= startY) {
      const label = now.getFullYear() + "-" + pad(now.getMonth() + 1, 2)
      const value = "netztest-opendata-" + label
      retVal.push([label, value])
      now.setMonth(now.getMonth() - 1)
    }
    return retVal
  })
  form?: FormGroup

  ngOnInit() {
    this.form = new FormGroup({
      csv: new FormControl(null),
      xlsx: new FormControl(null),
    })
  }

  download(event: string, extension: "zip" | "xlsx") {
    if (!event) return
    document.location.href = `${
      this.mainStore.api().url_web_statistic_server
    }/export/${event}.${extension}`
  }
}
