import { Component } from "@angular/core"
import { RouterOutlet } from "@angular/router"
import { MainStore } from "./modules/shared/store/main.store"
import { Observable } from "rxjs"
import { MatProgressBarModule } from "@angular/material/progress-bar"
import { AsyncPipe } from "@angular/common"

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

  constructor(private readonly mainStore: MainStore) {
    this.inProgress$ = this.mainStore.inProgress$
  }
}
