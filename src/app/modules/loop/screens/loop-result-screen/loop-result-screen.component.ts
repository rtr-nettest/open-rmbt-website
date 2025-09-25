import { Component, inject } from "@angular/core"
import {
  historyImports,
  HistoryScreenComponent,
} from "../../../history/screens/history-screen/history-screen.component"
import { ActivatedRoute } from "@angular/router"
import { LoopStoreService } from "../../store/loop-store.service"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { environment } from "../../../../../environments/environment"
import { firstValueFrom } from "rxjs"

@Component({
  selector: "app-loop-result-screen",
  imports: historyImports,
  templateUrl:
    "../../../history/screens/history-screen/history-screen.component.html",
  styleUrls: [
    "../../../history/screens/history-screen/history-screen.component.scss",
  ],
})
export class LoopResultScreenComponent extends HistoryScreenComponent {
  activatedRoute: ActivatedRoute = inject(ActivatedRoute)
  loopStore = inject(LoopStoreService)
  redirectUrl = `/${this.i18nStore.activeLang}/${ERoutes.LOOP_1}`
  override loopResults = true
  override shouldGroupHistory = false
  override result$ = this.service.getHistoryGroupedByLoop({
    grouped: this.shouldGroupHistory,
    loopUuid: this.loopStore.loopUuid(),
  })
  override excludeColumns =
    environment.loopModeDefaults.exclude_from_result ?? []
  override showHistoryFilter = false

  override ngOnInit(): void {
    super.ngOnInit()
    this.disableOnScroll()
    if (!this.loopStore.loopUuid()) {
      this.router.navigateByUrl(this.redirectUrl)
    }
  }

  protected override async fetchData(): Promise<Array<any>> {
    if (!this.uuid) {
      return []
    }
    const retVal = firstValueFrom(
      this.service.getFullMeasurementHistory(
        this.store.paginator(),
        this.loopStore.loopUuid()!
      )
    )
    this.store.paginator.set({
      offset: this.store.paginator().offset + this.dataLimit,
      limit: this.dataLimit,
    })
    return retVal
  }
}
