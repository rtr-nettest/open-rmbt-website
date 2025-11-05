import { Component, inject, signal } from "@angular/core"
import { RouterOutlet } from "@angular/router"
import { MainStore } from "./modules/shared/store/main.store"
import { Observable, retry, tap, timer } from "rxjs"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { AsyncPipe } from "@angular/common"
import { SettingsService } from "./modules/shared/services/settings.service"
import { TranslatePipe } from "./modules/i18n/pipes/translate.pipe"
import { Meta } from "@angular/platform-browser"
import { AnnouncerComponent } from "./modules/shared/components/announcer/announcer.component"
import { SkipLinkComponent } from "./modules/shared/components/skip-link/skip-link.component"

@Component({
  selector: "app-root",
  imports: [
    AsyncPipe,
    RouterOutlet,
    TranslatePipe,
    MatProgressBarModule,
    AnnouncerComponent,
    SkipLinkComponent,
  ],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  title = "open-rmbt-angular"
  error = signal(false)
  inProgress$!: Observable<boolean>
  settings$ = inject(SettingsService)
    .getSettings()
    .pipe(
      tap((settings) => {
        this.mainStore.settings.set(settings)
        this.error.set(false)
        this.meta.removeTag("name=robots")
      }),
      retry({
        delay: (_, attempt) => {
          this.error.set(true)
          if (attempt === 1) {
            this.meta.addTag({
              name: "robots",
              content: "noindex,nofollow",
            })
          }
          return attempt < 12 ? timer(5000) : timer(10000)
        },
      })
    )

  get skipLink() {
    return `${document.URL.replace(/#.*$/, "")}#mainContent`
  }

  constructor(
    private readonly mainStore: MainStore,
    private readonly meta: Meta
  ) {
    this.inProgress$ = this.mainStore.inProgress$
    const gitInfo = this.mainStore.gitInfo
    if (gitInfo.branch && gitInfo.hash) {
      console.log(`GIT: ${gitInfo.branch}-${gitInfo.hash.slice(0, 8)}`)
    }
    window.addEventListener("popstate", () => {
      this.mainStore.routingEvent.set("popstate")
    })
    window.addEventListener("pushstate", () => {
      this.mainStore.routingEvent.set("pushstate")
    })
  }
}
