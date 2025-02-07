import {
  ChangeDetectionStrategy,
  Component,
  input,
  signal,
} from "@angular/core"
import { MatButtonModule } from "@angular/material/button"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatFormField, MatInputModule } from "@angular/material/input"
import { ISimpleHistoryResult } from "../../interfaces/simple-history-result.interface"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { MatFormFieldModule } from "@angular/material/form-field"
import { MainStore } from "../../../shared/store/main.store"
import { ERoutes } from "../../../shared/constants/routes.enum"

@Component({
  selector: "app-share-result",
  standalone: true,
  imports: [
    MatButtonModule,
    MatFormFieldModule,
    MatFormField,
    MatInputModule,
    TranslatePipe,
  ],
  templateUrl: "./share-result.component.html",
  styleUrl: "./share-result.component.scss",
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ShareResultComponent {
  result = input<ISimpleHistoryResult | null>(null)
  forumBanner = signal<string>("")
  bannerHtml = signal<string>("")
  bannerBBCode = signal<string>("")

  constructor(
    private readonly i18nStore: I18nStore,
    private readonly mainStore: MainStore
  ) {}

  getForumBanner() {
    const openTestUUID = this.result()?.openTestResponse?.["open_test_uuid"]
    if (!openTestUUID) {
      return
    }
    const base = `${this.mainStore.api().url_web_statistic_server}/${
      this.i18nStore.activeLang
    }`
    const img = `${base}/${openTestUUID}/forumsmall.png`
    const url = `${document.URL.split("?")[0].replace(
      ERoutes.RESULT,
      ERoutes.OPEN_RESULT
    )}?open_test_uuid=${openTestUUID}`
    this.forumBanner.set(img)
    this.bannerHtml.set(`<a href="${url}"><img src="${img}"/></a>`)
    this.bannerBBCode.set(`[url=${url}][img]${img}[/img][/url]`)
  }

  selectText(event: MouseEvent) {
    ;(event.target as HTMLInputElement).select()
  }
}
