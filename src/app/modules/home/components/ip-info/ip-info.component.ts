import { Component } from "@angular/core"
import { IpService } from "../../../shared/services/ip.service"
import { from, map, Observable } from "rxjs"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { AsyncPipe } from "@angular/common"

@Component({
  selector: "app-ip-info",
  standalone: true,
  imports: [AsyncPipe, TranslatePipe],
  templateUrl: "./ip-info.component.html",
  styleUrl: "./ip-info.component.scss",
})
export class IpInfoComponent {
  ipV4$!: Observable<string>
  ipV6$!: Observable<string>

  constructor(private readonly ip: IpService) {
    this.ipV4$ = from(this.ip.getIpV4()).pipe(
      map((r) => (r ? r.ip : "Not available"))
    )
    this.ipV6$ = from(this.ip.getIpV6()).pipe(
      map((r) => (r ? r.ip : "Not available"))
    )
  }
}
