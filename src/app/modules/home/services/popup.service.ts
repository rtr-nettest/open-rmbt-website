import { Injectable } from "@angular/core"
import { Popup, Map } from "maplibre-gl"
import { IRecentMeasurement } from "../interfaces/recent-measurements-response.interface"
import { environment } from "../../../../environments/environment"
import { I18nStore } from "../../i18n/store/i18n.store"
import { firstValueFrom } from "rxjs"
import dayjs from "dayjs"
import { round } from "../../shared/util/math"

type PopupData = {
  time: string
  detailsUrl: string
  downloadClass: string
  download: string
  uploadClass: string
  upload: string
  pingClass: string
  ping: string
  signalClass: string
  signal: string
  connection: string
  operator: string
}

const UNKNOWN = "Unknown"

@Injectable({
  providedIn: "root",
})
export class PopupService {
  private popup!: Popup

  constructor(private readonly i18nStore: I18nStore) {}

  async addPopup(mapContainer: Map, measurement: IRecentMeasurement) {
    const content = await this.getPopupContent(measurement)
    if (!this.popup) {
      this.popup = new Popup()
    }

    if (content) {
      this.popup
        .setLngLat([measurement.long, measurement.lat])
        .addTo(mapContainer)
        .setHTML(content)
    }
  }

  private async getPopupContent(
    measurement: IRecentMeasurement
  ): Promise<string> {
    const t = this.i18nStore.translations
    const data: PopupData = {
      time: dayjs(measurement.time).format(`HH:mm:ss`),
      detailsUrl: `${environment.deployedUrl}/${this.i18nStore.activeLang}/result?open_test_uuid=${measurement.open_test_uuid}`,
      downloadClass: "",
      download: measurement.download_kbit
        ? `${round(measurement.download_kbit / 1000)} ${t["Mbps"]}`
        : t[UNKNOWN],
      uploadClass: "",
      upload: measurement.upload_kbit
        ? `${round(measurement.upload_kbit / 1000)} ${t["Mbps"]}`
        : t[UNKNOWN],
      pingClass: "",
      ping: measurement.ping_ms
        ? `${Math.round(measurement.ping_ms)} ${t["ms"]}`
        : t[UNKNOWN],
      signalClass: "",
      signal: measurement.signal_strength
        ? `${measurement.signal_strength} ${t["dBm"]}`
        : t[UNKNOWN],
      connection: measurement.platform
        ? measurement.platform.trim()
        : t[UNKNOWN],
      operator: measurement.provider_name ?? t[UNKNOWN],
    }
    let tpl = await firstValueFrom(this.i18nStore.getLocalizedHtml("map-popup"))
    for (const [key, val] of Object.entries(data)) {
      tpl = tpl.replace(`{{${key}}}`, val)
    }
    return tpl
  }
}
