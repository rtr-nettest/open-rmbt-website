import { Component, HostListener } from "@angular/core"
import { map, Observable } from "rxjs"
import { ILink } from "../../interfaces/link.interface"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { ERoutes } from "../../constants/routes.enum"
import { AsyncPipe } from "@angular/common"
import { MatButtonModule } from "@angular/material/button"
import { MatIconModule } from "@angular/material/icon"
import { RouterModule } from "@angular/router"
import { MatMenuModule } from "@angular/material/menu"
import {
  expandToFixedHeight,
  expandVertically,
} from "../../animations/detail-expand.animation"
import { arrowRotate } from "../../animations/arrow-rotate.animation"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"

@Component({
  selector: "app-top-nav",
  standalone: true,
  animations: [expandToFixedHeight, expandVertically, arrowRotate],
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    RouterModule,
    TranslatePipe,
  ],
  templateUrl: "./top-nav.component.html",
  styleUrl: "./top-nav.component.scss",
})
export class TopNavComponent {
  mainItems$!: Observable<ILink[]>
  subItems$!: Observable<ILink[]>
  startButton$!: Observable<ILink>
  submenuOpen = false
  mobileSubmenuOpen = false

  get activeLang() {
    return this.i18nStore.activeLang
  }

  constructor(private readonly i18nStore: I18nStore) {
    this.mainItems$ = this.i18nStore.getTranslations().pipe(
      map((v) => [
        {
          label: v["History"],
          route: this.localiseRoute(ERoutes.HISTORY),
        },
        {
          label: v["Map view"],
          route: this.localiseRoute(ERoutes.MAP),
        },
        {
          label: v["Statistics"],
          route: this.localiseRoute(ERoutes.STATISTICS),
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
          route: this.localiseRoute(ERoutes.LOOP_1),
        },
        {
          label: v["Certified measurement"],
          route: this.localiseRoute(ERoutes.CERTIFIED_1),
        },
        {
          label: v["App and Browser Test"],
          url: v["https://www.rtr.at/en/tk/rtrnetztest_tests"],
        },
        {
          label: v["Open data"],
          route: this.localiseRoute(ERoutes.OPEN_DATA),
        },
        {
          label: v["Options"],
          route: this.localiseRoute(ERoutes.OPTIONS),
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
        route: this.localiseRoute(ERoutes.TEST),
      }))
    )
  }

  localiseRoute(route: string) {
    return `/${this.activeLang}/${route}`
  }

  toggleSubmenu(event: MouseEvent) {
    event.stopPropagation()
    this.submenuOpen = !this.submenuOpen
  }

  toggleMobileSubmenu(event: MouseEvent) {
    event.stopPropagation()
    this.mobileSubmenuOpen = !this.mobileSubmenuOpen
  }

  @HostListener("document:click")
  hideMenu() {
    this.submenuOpen = false
  }
}
