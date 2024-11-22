import { Component } from "@angular/core"
import { map, Observable } from "rxjs"
import { ILink } from "../../interfaces/link.interface"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { ERoutes } from "../../constants/routes.enum"
import { AsyncPipe } from "@angular/common"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { RouterModule } from "@angular/router"
import { MatMenuModule } from "@angular/material/menu"

@Component({
  selector: "app-top-nav",
  standalone: true,
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterModule,
  ],
  templateUrl: "./top-nav.component.html",
  styleUrl: "./top-nav.component.scss",
})
export class TopNavComponent {
  mainItems$!: Observable<ILink[]>
  subItems$!: Observable<ILink[]>
  startButton$!: Observable<ILink>

  get activeLang() {
    return this.i18nStore.activeLang
  }

  constructor(private readonly i18nStore: I18nStore) {
    this.mainItems$ = this.i18nStore.getTranslations().pipe(
      map((v) => [
        {
          label: v["History"],
          route: ERoutes.HISTORY,
        },
        {
          label: v["Map view"],
          route: ERoutes.MAP,
        },
        {
          label: v["Statistics"],
          route: ERoutes.STATISTICS,
        },
        {
          label: v["Further"],
          route: "",
        },
      ])
    )
    this.subItems$ = this.i18nStore.getTranslations().pipe(
      map((v) => [
        {
          label: v["Loop mode"],
          route: ERoutes.LOOP,
        },
        {
          label: v["Certified measurement"],
          route: ERoutes.CERTIFIED,
        },
        {
          label: v["App and Browser Test"],
          url: v["https://www.rtr.at/en/tk/rtrnetztest_tests"],
        },
        {
          label: v["Open data"],
          route: ERoutes.OPEN_DATA,
        },
        {
          label: v["Options"],
          route: ERoutes.OPTIONS,
        },
        {
          label: v["Help"],
          url: v["https://www.netztest.at/redirect/en/help"],
        },
      ])
    )
    this.startButton$ = this.i18nStore.getTranslations().pipe(
      map((v) => ({
        label: v["Start test"],
        route: ERoutes.TEST,
      }))
    )
  }
}
