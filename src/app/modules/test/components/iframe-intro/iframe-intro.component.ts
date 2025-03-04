import { Component, inject, output } from "@angular/core"
import {
  FormBuilder,
  FormControl,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from "@angular/forms"
import { MainStore } from "../../../shared/store/main.store"
import { IMainMenuItem } from "../../../shared/interfaces/main-menu-item.interface"
import { I18nStore } from "../../../i18n/store/i18n.store"
import { TC_VERSION_ACCEPTED } from "../../constants/strings"
import { AsyncPipe } from "@angular/common"
import { MatButtonModule } from "@angular/material/button"
import { MatCheckboxModule } from "@angular/material/checkbox"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"

@Component({
  selector: "app-iframe-intro",
  imports: [
    AsyncPipe,
    MatButtonModule,
    MatCheckboxModule,
    ReactiveFormsModule,
    TranslatePipe,
  ],
  templateUrl: "./iframe-intro.component.html",
  styleUrl: "./iframe-intro.component.scss",
})
export class IframeIntroComponent {
  fb = inject(FormBuilder)
  form!: FormGroup
  i18nStore = inject(I18nStore)
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
  onSubmit = output()
  text$ = this.i18nStore.getLocalizedHtml("iframe")

  constructor() {
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
    console.log(this.form.invalid)
    if (!this.form.invalid) {
      const termsVersion =
        this.mainStore.settings()?.settings[0].terms_and_conditions.version
      if (globalThis.localStorage && termsVersion) {
        localStorage.setItem(TC_VERSION_ACCEPTED, termsVersion.toString())
        this.onSubmit.emit()
      }
    }
  }
}
