import { Component, OnInit, signal } from "@angular/core"
import { IpService } from "../../../shared/services/ip.service"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { MatProgressSpinnerModule } from "@angular/material/progress-spinner"
import { OptionsStoreService } from "../../../options/store/options-store.service"

@Component({
  selector: "app-ip-info",
  imports: [MatProgressSpinnerModule, TranslatePipe],
  templateUrl: "./ip-info.component.html",
  styleUrl: "./ip-info.component.scss",
})
export class IpInfoComponent implements OnInit {
  ipV4 = signal<string | null>(null)
  ipV6 = signal<string | null>(null)
  ipV4Loading = signal<boolean>(true)
  ipV6Loading = signal<boolean>(true)

  constructor(
    private readonly ip: IpService,
    private readonly optionsStore: OptionsStoreService
  ) {}

  ngOnInit(): void {
    this.ip.getIpV4().then((r) => {
      this.ipV4.set(r ? r.ip : "Not available")
      this.ipV4Loading.set(false)
      if (!r) {
        this.optionsStore.disableIpVersion("ipv4")
      }
    })
    this.ip.getIpV6().then((r) => {
      this.ipV6.set(r ? r.ip : "Not available")
      this.ipV6Loading.set(false)
      if (!r) {
        this.optionsStore.disableIpVersion("ipv6")
      }
    })
  }
}
