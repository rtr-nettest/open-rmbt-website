import { Injectable } from "@angular/core"
import { I18nStore } from "../../i18n/store/i18n.store"
import {
  concatMap,
  firstValueFrom,
  from,
  interval,
  Subscription,
  tap,
} from "rxjs"
import dayjs from "dayjs"
import { MeasurementsService } from "./measurements.service"

const DATA_UPDATE_INTERVAL = 3000
const ID = "fullScreenStats"

type PopupData = {
  time: string
  minutesTests?: number
  minutes?: number
  hoursTests?: number
  hours?: number
}

@Injectable({
  providedIn: "root",
})
export class FullScreenService {
  private popup?: HTMLDivElement
  private dataSub?: Subscription
  private data?: PopupData
  private timeSub?: Subscription

  constructor(
    private readonly i18nStore: I18nStore,
    private readonly measurements: MeasurementsService
  ) {}

  async addPopup() {
    if (this.popup) {
      return
    }
    const content = await this.getData()
    this.popup = document.createElement("div")
    this.popup.id = ID
    this.popup.innerHTML = content
    document.getElementById("map")?.appendChild(this.popup)
    this.dataSub = interval(DATA_UPDATE_INTERVAL)
      .pipe(
        concatMap(() => from(this.getData())),
        tap((content) => {
          if (this.popup) this.popup!.innerHTML = content
        })
      )
      .subscribe()
    this.timeSub = interval(1000)
      .pipe(
        concatMap(() => from(this.getTime())),
        tap((content) => {
          if (this.popup) this.popup!.innerHTML = content
        })
      )
      .subscribe()
  }

  removePopup() {
    this.dataSub?.unsubscribe()
    this.timeSub?.unsubscribe()
    document.getElementById(ID)?.remove()
    delete this.popup
  }

  private async getTime(): Promise<string> {
    this.data!.time = dayjs().format("HH:mm:ss")
    return this.parseTpl()
  }

  private async getData(): Promise<string> {
    const stats = await firstValueFrom(this.measurements.getRecentStats())
    this.data = {
      ...(this.data ?? { time: dayjs().format("HH:mm:ss") }),
      minutes: 30,
      minutesTests: stats["30min"],
      hours: 24,
      hoursTests: stats["24h"],
    }

    return this.parseTpl()
  }

  private async parseTpl() {
    let retVal = await firstValueFrom(
      this.i18nStore.getLocalizedHtml("map-fullscreen-stats")
    )
    for (const [key, val] of Object.entries(this.data!)) {
      if (val) {
        retVal = retVal.replace(`{{${key}}}`, val.toString())
      }
    }
    return retVal
  }
}
