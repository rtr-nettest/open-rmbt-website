import {
  Component,
  computed,
  HostListener,
  inject,
  signal,
} from "@angular/core"
import { TranslatePipe } from "../../../i18n/pipes/translate.pipe"
import { SeoComponent } from "../../../shared/components/seo/seo.component"
import { SettingsService } from "../../../shared/services/settings.service"
import { firstValueFrom } from "rxjs"
import { IframeIntroComponent } from "../../components/iframe-intro/iframe-intro.component"
import { IframeTestComponent } from "../../components/iframe-test/iframe-test.component"
import { EMeasurementStatus } from "../../constants/measurement-status.enum"

@Component({
  selector: "app-iframe",
  imports: [IframeIntroComponent, IframeTestComponent, TranslatePipe],
  templateUrl: "./iframe.component.html",
  styleUrl: "./iframe.component.scss",
})
export class IframeComponent extends SeoComponent {
  settingsService = inject(SettingsService)
  testIsRunning = signal(false)
  error = signal<string | null>(null)
  warning = computed(() => {
    if (window !== window.parent) {
      if (document.referrer) {
        return null
      } else {
        return "RTR-NetTest could not be loaded. Please check the iframe tag."
      }
    }
    return null
  })

  get activeLang() {
    return this.i18nStore.activeLang
  }

  async launchTest() {
    try {
      await firstValueFrom(this.settingsService.getSettings())
      this.testService.triggerNextIframeTest()
      this.testIsRunning.set(true)
    } catch (e) {
      this.error.set("error_during_test")
      console.error(e)
    }
  }

  @HostListener("window:beforeunload")
  preventReload() {
    return [
      EMeasurementStatus.END,
      EMeasurementStatus.ERROR,
      EMeasurementStatus.NOT_STARTED,
      EMeasurementStatus.SHOWING_RESULTS,
    ].includes(this.testStore.visualization$.value?.currentPhaseName)
  }

  @HostListener("window:unload")
  unload() {
    this.testService.sendAbort(this.testStore.basicNetworkInfo().testUuid)
  }
}
