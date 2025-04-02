import { AfterViewInit, Component, inject } from "@angular/core"
import {
  ActionButtonsPosition,
  historyImports,
} from "../../../history/screens/history-screen/history-screen.component"
import { LoopResultScreenComponent } from "../../../loop/screens/loop-result-screen/loop-result-screen.component"
import { IMainMenuItem } from "../../../shared/interfaces/main-menu-item.interface"
import { ERoutes } from "../../../shared/constants/routes.enum"
import { CertifiedExportService } from "../../services/certified-export.service"

@Component({
  selector: "app-loop-result-screen",
  imports: historyImports,
  templateUrl:
    "../../../history/screens/history-screen/history-screen.component.html",
  styleUrls: [
    "../../../history/screens/history-screen/history-screen.component.scss",
  ],
})
export class CertifiedResultScreenComponent
  extends LoopResultScreenComponent
  implements AfterViewInit
{
  override exporter = inject(CertifiedExportService)
  override actionButtonsPosition = "html-wrapper" as ActionButtonsPosition
  override actionButtons: IMainMenuItem[] = [
    {
      label: "",
      icon: "filetype-pdf",
      action: () => this.exporter.openCertifiedPdf(this.loopStore.loopUuid()),
    },
  ]
  override redirectUrl = `/${this.i18nStore.activeLang}/${ERoutes.CERTIFIED_1}`
  override text$ = this.i18nStore.getLocalizedHtml("certified-result")

  ngAfterViewInit(): void {
    this.exporter.openCertifiedPdf(this.loopStore.loopUuid()).subscribe()
  }
}
