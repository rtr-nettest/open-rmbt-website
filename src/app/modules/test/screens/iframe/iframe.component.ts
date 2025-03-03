import { Component, inject, OnInit } from "@angular/core"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { AsyncPipe } from "@angular/common"
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms"
import { TestService } from "../../services/test.service"
import { MatButtonModule } from "@angular/material/button"
import { MatCheckboxModule } from "@angular/material/checkbox"
import { MainStore } from "../../../shared/store/main.store"
import {
  TC_VERSION_ACCEPTED,
  TERMS_AND_CONDITIONS,
} from "../../constants/strings"
import { SettingsService } from "../../../shared/services/settings.service"
import { firstValueFrom } from "rxjs"
import { IMainMenuItem } from "../../../shared/interfaces/main-menu-item.interface"

@Component({
  selector: "app-iframe",
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: "./iframe.component.html",
  styleUrl: "./iframe.component.scss",
})
export class IframeComponent extends SeoComponent implements OnInit {
  fb = inject(FormBuilder)
  form!: FormGroup
  mainStore = inject(MainStore)
  menu: IMainMenuItem[] = [
    {
      label: "Publishing information",
      url: "https://www.rtr.at/rtr/footer/impressum.de.html",
    },
    {
      label: "Accessibility",
      url: "https://www.rtr.at/rtr/footer/Barrierefreiheit.de.html",
    },
    {
      label: "Privacy",
      url: "https://www.rtr.at/de/tk/netztestprivacypolicyweb",
    },
    {
      label: "Open Source",
      url: "https://github.com/rtr-nettest",
    },
  ]
  settingsService = inject(SettingsService)
  text$ = this.i18nStore.getLocalizedHtml("iframe")
  testService = inject(TestService)

  get activeLang() {
    return this.i18nStore.activeLang
  }

  ngOnInit(): void {
    if (!globalThis.localStorage) {
      return
    }
    this.form = this.fb.group({
      agree: new FormControl(
        {
          value: false,
          disabled:
            this.mainStore.settings()?.settings[0].terms_and_conditions
              .version ===
            parseFloat(localStorage.getItem(TC_VERSION_ACCEPTED) ?? ""),
        },
        Validators.requiredTrue
      ),
    })
  }

  async submit() {
    if (this.form.valid) {
      const termsVersion =
        this.mainStore.settings()?.settings[0].terms_and_conditions.version
      if (globalThis.localStorage && termsVersion) {
        localStorage.setItem(TC_VERSION_ACCEPTED, termsVersion.toString())
        try {
          await firstValueFrom(this.settingsService.getSettings())
          this.testService.triggerNextTest()
        } catch (e) {
          console.error(e)
        }
      }
    }
  }
}
