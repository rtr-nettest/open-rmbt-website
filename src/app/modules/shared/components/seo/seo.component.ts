import { Component, inject, Input, OnDestroy } from "@angular/core"
import { Title } from "@angular/platform-browser"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { Subject, Subscription, takeUntil, tap } from "rxjs"
import { TestStore } from "../../../test/store/test.store"
import { TestService } from "../../../test/services/test.service"

const SEP = " | "

@Component({
  selector: "app-seo",
  imports: [],
  template: "",
})
export class SeoComponent implements OnDestroy {
  destroyed$: Subject<void> = new Subject()
  titleSub!: Subscription
  metaTitle = ""
  @Input() set title(t: string) {
    this._title = t
    this.titleSub = this.i18nStore
      .getTranslations()
      .pipe(
        takeUntil(this.destroyed$),
        tap((dict) => {
          const siteName = this.i18nStore.translate("RTR-NetTest")
          let title = dict[t] || t
          const newTitle = title ? [title, siteName].join(SEP) : siteName
          this.metaTitle = newTitle
          this.ts.setTitle(newTitle)
          document.documentElement.lang = this.i18nStore.activeLang
        })
      )
      .subscribe()
  }
  protected readonly testStore = inject(TestStore)
  protected readonly testService = inject(TestService)
  private _title!: string

  get title() {
    return this._title
  }

  constructor(
    protected readonly ts: Title,
    protected readonly i18nStore: I18nStore
  ) {
    if (this.testStore.shouldAbort()) {
      this.testStore.shouldAbort.set(false)
      location.reload()
    }
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }
}
