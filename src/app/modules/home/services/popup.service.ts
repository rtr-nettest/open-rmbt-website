import { Injectable } from "@angular/core"
import { Popup, Map } from "maplibre-gl"
import { IRecentMeasurement } from "../interfaces/recent-measurements-response.interface"
import { environment } from "../../../../environments/environment"
import { I18nStore } from "../../i18n/store/i18n.store"
import { firstValueFrom } from "rxjs"
import dayjs from "dayjs"
import { round } from "../../shared/util/math"
import {
  ClassificationService,
  GSM_CONNECTION_TYPES,
  LTE_CONNECTION_TYPES,
  THRESHOLD_DOWNLOAD,
  THRESHOLD_PING,
  THRESHOLD_SIGNAL_GSM,
  THRESHOLD_SIGNAL_LTE,
  THRESHOLD_SIGNAL_WLAN,
  THRESHOLD_UPLOAD,
} from "../../shared/services/classification.service"
import { ERoutes } from "../../shared/constants/routes.enum"

type PopupData = {
  time: string
  detailsUrl: string
  downloadClass: number
  download: string
  uploadClass: number
  upload: string
  pingClass: number
  ping: string
  signalClass?: number
  signal?: string
  connection: string
  operator: string
}

const UNKNOWN = "Unknown"

@Injectable({
  providedIn: "root",
})
export class PopupService {
  private popup!: Popup

  constructor(
    private readonly i18nStore: I18nStore,
    private readonly classification: ClassificationService
  ) {}

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
    const signal = measurement.signal_strength ?? measurement.lte_rsrp
    let signalThreshold = THRESHOLD_SIGNAL_WLAN
    for (const ct of GSM_CONNECTION_TYPES) {
      if (measurement.platform?.includes(ct)) {
        signalThreshold = THRESHOLD_SIGNAL_GSM
        break
      }
    }
    for (const ct of LTE_CONNECTION_TYPES) {
      if (measurement.platform?.includes(ct)) {
        signalThreshold = THRESHOLD_SIGNAL_LTE
        break
      }
    }
    const data: PopupData = {
      time: dayjs(measurement.time).format(`HH:mm:ss`),
      detailsUrl: `${environment.deployedUrl}/${this.i18nStore.activeLang}/${ERoutes.RESULT}?open_test_uuid=${measurement.open_test_uuid}`,
      downloadClass: this.classification.classify(
        measurement.download_kbit,
        THRESHOLD_DOWNLOAD,
        "biggerBetter"
      ),
      download: measurement.download_kbit
        ? `${round(measurement.download_kbit / 1000)} ${t["Mbps"]}`
        : t[UNKNOWN],
      uploadClass: this.classification.classify(
        measurement.upload_kbit,
        THRESHOLD_UPLOAD,
        "biggerBetter"
      ),
      upload: measurement.upload_kbit
        ? `${round(measurement.upload_kbit / 1000)} ${t["Mbps"]}`
        : t[UNKNOWN],
      pingClass: this.classification.classify(
        measurement.ping_ms,
        THRESHOLD_PING,
        "smallerBetter"
      ),
      ping: measurement.ping_ms
        ? `${Math.round(measurement.ping_ms)} ${t["ms"]}`
        : t[UNKNOWN],
      signalClass: this.classification.classify(
        signal,
        signalThreshold,
        "biggerBetter"
      ),
      signal: signal ? `${signal} ${t["dBm"]}` : t[UNKNOWN],
      connection: measurement.platform
        ? measurement.platform.trim()
        : t[UNKNOWN],
      operator: measurement.provider_name ?? t[UNKNOWN],
    }
    let tpl = await firstValueFrom(this.i18nStore.getLocalizedHtml("map-popup"))
    for (const [key, val] of Object.entries(data)) {
      if (val) {
        tpl = tpl.replace(`{{${key}}}`, val.toString())
      }
    }
    if (tpl.includes("{{signal}}")) {
      tpl = tpl.replace(`id="popupSignalRow"`, `style="display:none;"`)
    }
    return tpl
  }
}
