import { Component, inject } from "@angular/core"
import { RouterOutlet } from "@angular/router"
import { MainStore } from "./modules/shared/store/main.store"
import { Observable, tap } from "rxjs"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { AsyncPipe } from "@angular/common"
import { SettingsService } from "./modules/shared/services/settings.service"
import * as pack from "../../package.json"

@Component({
    selector: "app-root",
    imports: [AsyncPipe, RouterOutlet, MatProgressBarModule],
    templateUrl: "./app.component.html",
    styleUrl: "./app.component.scss"
})
export class AppComponent {
  title = "open-rmbt-angular"
  inProgress$!: Observable<boolean>
  settings$ = inject(SettingsService)
    .getSettings()
    .pipe(tap((settings) => this.mainStore.settings.set(settings)))

  constructor(private readonly mainStore: MainStore) {
    this.inProgress$ = this.mainStore.inProgress$
    const gitInfo = pack.gitInfo as any
    if (gitInfo["branch"] && gitInfo["hash"]) {
      console.log(
        `Branch-hash: ${gitInfo["branch"]}-${gitInfo["hash"].slice(0, 8)}`
      )
    }
  }
}
