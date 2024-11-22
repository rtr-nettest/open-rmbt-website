import { Component, Input, OnDestroy, OnInit } from "@angular/core"
import { Title } from "@angular/platform-browser"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { Subscription, tap } from "rxjs"

const SEP = " | "

@Component({
  selector: "app-seo",
  standalone: true,
  imports: [],
  template: "",
})
export class SeoComponent implements OnDestroy {
  titleSub!: Subscription
  @Input() set title(t: string) {
    this.titleSub = this.i18nStore
      .getTranslations()
      .pipe(
        tap((dict) => {
          const titleArr = this.ts.getTitle().split(SEP)
          const siteName = titleArr.length === 1 ? titleArr[0] : titleArr[1]
          let title = dict[t] || t
          const newTitle = title ? [title, siteName].join(SEP) : siteName
          this.ts.setTitle(newTitle)
        })
      )
      .subscribe()
  }

  constructor(
    protected readonly ts: Title,
    protected readonly i18nStore: I18nStore
  ) {}

  ngOnDestroy(): void {
    this.titleSub.unsubscribe()
  }
}
