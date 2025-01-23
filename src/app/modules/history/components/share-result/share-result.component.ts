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
import { HistoryExportService } from "../../services/history-export.service"
import { MainStore } from "../../../shared/store/main.store"

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
  pdfButtonDisabled = signal<boolean>(false)
  get socialMedia() {
    if (!globalThis.document) {
      return []
    }
    return [
      {
        icon: "twitter",
        url: `https://twitter.com/intent/tweet?text=RTR-NetTest&url=${document.URL}`,
        label: "Twitter",
        title: "Share on Twitter",
      },
      {
        icon: "facebook",
        url: `https://www.facebook.com/sharer/sharer.php?u=${document.URL}`,
        label: "Facebook",
        title: "Share on Facebook",
      },
      {
        icon: "whatsapp",
        url: `whatsapp://send?text=RTR-NetTest%20${document.URL}`,
        label: "WhatsApp",
        title: "Share via WhatsApp",
      },
    ]
  }

  constructor(
    private readonly i18nStore: I18nStore,
    private readonly history: HistoryExportService,
    private readonly mainStore: MainStore
  ) {}

  getForumBanner() {
    const openTestUUID = this.result()?.openTestResponse?.["open_test_uuid"]
    if (!openTestUUID) {
      return
    }
    const base = `${this.mainStore.api().url_statistic_server}/${
      this.i18nStore.activeLang
    }`
    const img = `${base}/${openTestUUID}/forumsmall.png`
    this.forumBanner.set(img)
    this.bannerHtml.set(`<a href="${document.URL}"><img src="${img}"/></a>`)
    this.bannerBBCode.set(`[url=${document.URL}][img]${img}[/img][/url]`)
  }

  getPdf() {
    this.pdfButtonDisabled.set(true)
    this.history.exportAsPdf([this.result()!]).subscribe(() => {
      this.pdfButtonDisabled.set(false)
    })
  }

  print() {
    window.print()
  }

  selectText(event: MouseEvent) {
    ;(event.target as HTMLInputElement).select()
  }
}
