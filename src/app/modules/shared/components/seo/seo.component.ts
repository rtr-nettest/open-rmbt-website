import {
  Component,
  inject,
  Input,
  OnDestroy,
  afterEveryRender,
} from "@angular/core"
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
        }),
      )
      .subscribe()
  }
  protected readonly i18nStore: I18nStore = inject(I18nStore)
  protected readonly testStore = inject(TestStore)
  protected readonly testService = inject(TestService)
  protected readonly ts: Title = inject(Title)
  private _title!: string

  get fragment() {
    return globalThis?.location?.hash?.replace("#", "") ?? ""
  }

  get hideMenu() {
    const hash = globalThis.location?.hash ?? ""
    return hash == "#noMMenu"
  }

  get title() {
    return this._title
  }

  constructor() {
    if (this.testStore.shouldAbort()) {
      this.testStore.shouldAbort.set(false)
      location.reload()
    }
    afterEveryRender(() => {
      this.afterEveryRender()
    })
  }

  ngOnDestroy(): void {
    this.destroyed$.next()
    this.destroyed$.complete()
  }

  afterEveryRender() {
    // to be overridden
  }
}
