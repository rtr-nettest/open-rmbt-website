import { Component, inject, signal } from "@angular/core"
import { RouterOutlet } from "@angular/router"
import { MainStore } from "./modules/shared/store/main.store"
import { Observable, retry, tap, timer } from "rxjs"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { AsyncPipe } from "@angular/common"
import { SettingsService } from "./modules/shared/services/settings.service"
import * as pack from "../../package.json"
import { TranslatePipe } from "./modules/i18n/pipes/translate.pipe"

@Component({
  selector: "app-root",
  imports: [AsyncPipe, RouterOutlet, TranslatePipe, MatProgressBarModule],
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
      }),
      retry({
        delay: (_, attempt) => {
          this.error.set(true)
          return attempt < 12 ? timer(5000) : timer(10000)
        },
      })
    )

  constructor(private readonly mainStore: MainStore) {
    this.inProgress$ = this.mainStore.inProgress$
    const gitInfo = pack.gitInfo as any
    if (gitInfo["branch"] && gitInfo["hash"]) {
      console.log(
        `Branch-hash: ${gitInfo["branch"]}-${gitInfo["hash"].slice(0, 8)}`
      )
    }
    window.addEventListener("popstate", () => {
      this.mainStore.routingEvent.set("popstate")
    })
    window.addEventListener("pushstate", () => {
      this.mainStore.routingEvent.set("pushstate")
    })
  }
}
