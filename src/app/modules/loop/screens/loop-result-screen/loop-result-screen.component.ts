import { Component, inject } from "@angular/core"
import {
  historyImports,
  HistoryScreenComponent,
} from "../../../history/screens/history-screen/history-screen.component"
import { ActivatedRoute, Router } from "@angular/router"
import { LoopStoreService } from "../../store/loop-store.service"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { environment } from "../../../../../environments/environment"

@Component({
  selector: "app-loop-result-screen",
  imports: historyImports,
  templateUrl:
    "../../../history/screens/history-screen/history-screen.component.html",
  styleUrls: [
    "../../../history/screens/history-screen/history-screen.component.scss",
  ],
  standalone: true,
})
export class LoopResultScreenComponent extends HistoryScreenComponent {
  activatedRoute: ActivatedRoute = inject(ActivatedRoute)
  loopStore = inject(LoopStoreService)
  router = inject(Router)
  redirectUrl = `/${this.i18nStore.activeLang}/${ERoutes.LOOP_1}`
  override shouldGroupHistory = false
  override result$ = this.service.getHistoryGroupedByLoop({
    grouped: this.shouldGroupHistory,
    loopUuid: this.loopStore.loopUuid(),
  })
  override excludeColumns =
    environment.loopModeDefaults.exclude_from_result ?? []

  override ngOnDestroy(): void {
    super.ngOnDestroy()
    this.loopStore.loopUuid.set(null)
  }

  override ngOnInit(): void {
    super.ngOnInit()
    this.disableOnScroll()
    if (!this.loopStore.loopUuid()) {
      this.router.navigateByUrl(this.redirectUrl)
    }
  }
}
