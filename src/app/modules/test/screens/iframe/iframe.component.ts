import { Component, inject, signal } from "@angular/core"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { SettingsService } from "../../../shared/services/settings.service"
import { firstValueFrom } from "rxjs"
import { TestService } from "../../services/test.service"
import { IframeIntroComponent } from "../../components/iframe-intro/iframe-intro.component"
import { IframeTestComponent } from "../../components/iframe-test/iframe-test.component"

@Component({
  selector: "app-iframe",
  imports: [IframeIntroComponent, IframeTestComponent, TranslatePipe],
  templateUrl: "./iframe.component.html",
  styleUrl: "./iframe.component.scss",
})
export class IframeComponent extends SeoComponent {
  settingsService = inject(SettingsService)
  testIsRunning = signal(false)
  testService = inject(TestService)

  get activeLang() {
    return this.i18nStore.activeLang
  }

  async launchTest() {
    try {
      await firstValueFrom(this.settingsService.getSettings())
      this.testService.triggerNextTest()
      this.testIsRunning.set(true)
    } catch (e) {
      console.error(e)
    }
  }
}
