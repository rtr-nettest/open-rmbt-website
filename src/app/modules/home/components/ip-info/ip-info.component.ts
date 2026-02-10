import { Component, inject, OnDestroy, signal } from "@angular/core"
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
  // TODO: probably will be deleted in the future.
  ipV4Loading = signal<boolean>(false)
  ipV6Loading = signal<boolean>(false)

  constructor() {
    this.ipService.watchIpChanges()
  }

  ngOnDestroy() {
    this.ipService.watchIpChanges(false)
  }
}
