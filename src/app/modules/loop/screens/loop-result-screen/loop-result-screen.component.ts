import { Component, inject } from "@angular/core"
import {
  historyImports,
  HistoryScreenComponent,
} from "../../../history/screens/history-screen/history-screen.component"
import { ActivatedRoute } from "@angular/router"

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
  override shouldGroupHistory = false
  override result$ = this.service.getHistoryGroupedByLoop({
    grouped: this.shouldGroupHistory,
    loopUuid: this.activatedRoute.snapshot.queryParams["loop_uuid"],
  })

  override ngOnInit(): void {
    super.ngOnInit()
    this.scrollNLoad.disableOnScroll()
  }
}
