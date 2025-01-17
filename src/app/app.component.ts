import { Component } from "@angular/core"
import { RouterOutlet } from "@angular/router"
import { MainStore } from "./modules/shared/store/main.store"
import { Observable, take } from "rxjs"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { AsyncPipe } from "@angular/common"
import { SettingsService } from "./modules/shared/services/settings.service"
import * as pack from "../../package.json"

@Component({
  selector: "app-root",
  standalone: true,
  imports: [AsyncPipe, RouterOutlet, MatProgressBarModule],
  templateUrl: "./app.component.html",
  styleUrl: "./app.component.scss",
})
export class AppComponent {
  title = "open-rmbt-angular"
  inProgress$!: Observable<boolean>

  constructor(
    private readonly mainStore: MainStore,
    private readonly settingsService: SettingsService
  ) {
    this.inProgress$ = this.mainStore.inProgress$
    this.settingsService
      .getSettings()
      .pipe(take(1))
      .subscribe((settings) => {
        this.mainStore.settings.set(settings)
      })
    const gitInfo = pack.gitInfo as any
    console.log(
      `Branch-hash: ${gitInfo["branch"]}-${gitInfo["hash"].slice(0, 8)}`
    )
  }
}
