import { Component, computed, inject, OnInit, signal } from "@angular/core"
import { HeaderComponent } from "../../../shared/components/header/header.component"
import { TopNavComponent } from "../../../shared/components/top-nav/top-nav.component"
import { BreadcrumbsComponent } from "../../../shared/components/breadcrumbs/breadcrumbs.component"
import { ScrollTopComponent } from "../../../shared/components/scroll-top/scroll-top.component"
import { FooterComponent } from "../../../shared/components/footer/footer.component"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { SprintfPipe } from "../../../shared/pipes/sprintf.pipe"
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
} from "@angular/forms"
import {
  IpVersion,
  OptionsStoreService,
} from "../../store/options-store.service"
import { MatButtonModule } from "@angular/material/button"
import { MatRadioModule } from "@angular/material/radio"
import { UUID } from "../../../test/constants/strings"
import { IpService } from "../../../shared/services/ip.service"
import { AsyncPipe } from "@angular/common"

@Component({
  selector: "app-options-screen",
  imports: [
    AsyncPipe,
    HeaderComponent,
    TopNavComponent,
    BreadcrumbsComponent,
    ScrollTopComponent,
    FooterComponent,
    TranslatePipe,
    SprintfPipe,
    ReactiveFormsModule,
    MatRadioModule,
    MatButtonModule,
  ],
  templateUrl: "./options-screen.component.html",
  styleUrl: "./options-screen.component.scss",
})
export class OptionsScreenComponent extends SeoComponent implements OnInit {
  fb = inject(FormBuilder)
  store = inject(OptionsStoreService)
  ipService = inject(IpService)
  ipVersionOptions: { label: string; value: IpVersion }[] = [
    {
      label: "Auto",
      value: "default",
    },
    {
      label: "IPv4 only",
      value: "ipv4",
    },
    {
      label: "IPv6 only",
      value: "ipv6",
    },
  ]
  disabledIpVersions = computed(() => this.store.disabledIpVersions())
  form?: FormGroup
  uuid = computed(() => {
    const uuid = localStorage.getItem(UUID)
    if (!uuid) {
      return ""
    }
    return "U" + uuid
  })
  loading = signal<boolean>(true)
  error = signal<string | null>(null)
  text$ = this.i18nStore.getLocalizedHtml("options")

  ngOnInit(): void {
    Promise.all([this.ipService.getIpV4(), this.ipService.getIpV6()])
      .then(([v4, v6]) => {
        if (!v4) {
          this.store.disableIpVersion("ipv4")
        }
        if (!v6) {
          this.store.disableIpVersion("ipv6")
        }
        this.form = this.fb.group({
          ipVersion: new FormControl(this.store.ipVersion() || "default"),
        })
      })
      .catch(() => {
        this.error.set("Failed to load IP information")
      })
      .finally(() => {
        this.loading.set(false)
      })
  }

  submit(): void {
    if (this.form) {
      this.store.ipVersion.set(this.form.value.ipVersion)
    }
  }
}
