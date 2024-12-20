import {
  ChangeDetectionStrategy,
  Component,
  ElementRef,
  input,
  signal,
  ViewChild,
} from "@angular/core"
import { MatButtonModule } from "@angular/material/button"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatFormField, MatInputModule } from "@angular/material/input"
import { ISimpleHistoryResult } from "../../interfaces/simple-history-result.interface"
import { environment } from "../../../../../environments/environment"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { HttpClient } from "@angular/common/http"
import { HistoryExportService } from "../../services/history-export.service"

@Component({
  selector: "app-share-result",
  standalone: true,
  imports: [MatButtonModule, MatFormField, MatInputModule, TranslatePipe],
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

  constructor(
    private readonly i18nStore: I18nStore,
    private readonly history: HistoryExportService
  ) {}

  getForumBanner() {
    const openTestUUID = this.result()?.openTestResponse?.["open_test_uuid"]
    if (!openTestUUID) {
      return
    }
    const base = `${environment.api.cloud}/RMBTStatisticServer/${this.i18nStore.activeLang}`
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

  selectText(event: MouseEvent) {
    ;(event.target as HTMLInputElement).select()
  }
}
