import { Component } from "@angular/core"
import { historyImports } from "../../../history/screens/history-screen/history-screen.component"
import { LoopResultScreenComponent } from "../../../loop/screens/loop-result-screen/loop-result-screen.component"
import { IMainMenuItem } from "../../../shared/interfaces/main-menu-item.interface"

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
export class CertifiedResultScreenComponent extends LoopResultScreenComponent {
  override actionButtons: IMainMenuItem[] = [
    {
      label: "",
      icon: "filetype-pdf",
      action: () =>
        this.exporter.exportAsCertified(
          this.activatedRoute.snapshot.queryParams["loop_uuid"]
        ),
    },
  ]
  override text$ = this.i18nStore.getLocalizedHtml("certified-result")
}
