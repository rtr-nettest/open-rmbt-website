import { Component, inject, OnDestroy } from "@angular/core"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { IpService } from "../../../shared/services/ip.service"

@Component({
  selector: "app-ip-info",
  imports: [MatProgressSpinnerModule, TranslatePipe],
  templateUrl: "./ip-info.component.html",
  styleUrl: "./ip-info.component.scss",
})
export class IpInfoComponent implements OnDestroy {
  private readonly ipService = inject(IpService)
  ipV4 = this.ipService.ipV4
  ipV6 = this.ipService.ipV6
  ipV4Loading = this.ipService.ipV4Loading
  ipV6Loading = this.ipService.ipV6Loading

  constructor() {
    this.ipService.watchIpChanges()
  }

  ngOnDestroy() {
    this.ipService.watchIpChanges(false)
  }
}
