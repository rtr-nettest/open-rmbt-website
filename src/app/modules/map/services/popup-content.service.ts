import { inject, Injectable } from "@angular/core"
import { Popup, Map } from "maplibre-gl"
import { IRecentMeasurement } from "../../opendata/interfaces/recent-measurements-response.interface"
import { environment } from "../../../../environments/environment"
import { I18nStore } from "../../i18n/store/i18n.store"
import { firstValueFrom } from "rxjs"
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
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
import { roundToSignificantDigits } from "../../shared/util/math"

dayjs.extend(utc)
dayjs.extend(tz)

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

export const UNKNOWN = "Unknown"

export const POPUP_IDS_MAP: Record<string, string> = {
  popupTimeRow: "{{time}}",
  popupDownloadRow: "{{download}}",
  popupUploadRow: "{{upload}}",
  popupPingRow: "{{ping}}",
  popupSignalRow: "{{signal}}",
  popupOffsetRow: "{{offset}}",
  popupDurationRow: "{{duration}}",
  popupRadiusRow: "{{radius}}",
  popupConnectionRow: "{{connection}}",
  popupOperatorRow: "{{operator}}",
}

@Injectable({
  providedIn: "root",
})
export class PopupContentService {
  protected readonly i18nStore = inject(I18nStore)
  protected readonly classification = inject(ClassificationService)

  async getPopupContent(measurements: Record<string, any>[]) {
    const retVal = await Promise.all(
      measurements.map((measurement) => this.getSingleMeasurement(measurement)),
    )
    return (
      "<div class='app-popup-wrapper'>" +
      (retVal.length === 1
        ? retVal[0]
        : retVal.join("<hr class='app-separator'/>")) +
      "</div>"
    )
  }

  protected async getSingleMeasurement(
    measurement: Record<string, any>,
  ): Promise<string> {
    const t = this.i18nStore.translate.bind(this.i18nStore)
    const signal = measurement["signal_strength"] ?? measurement["lte_rsrp"]
    let signalThreshold = THRESHOLD_SIGNAL_WLAN
    for (const ct of GSM_CONNECTION_TYPES) {
      if (measurement["platform"]?.includes(ct)) {
        signalThreshold = THRESHOLD_SIGNAL_GSM
        break
      }
    }
    for (const ct of LTE_CONNECTION_TYPES) {
      if (measurement["platform"]?.includes(ct)) {
        signalThreshold = THRESHOLD_SIGNAL_LTE
        break
      }
    }
    const data: PopupData = {
      time: measurement["time"],
      detailsUrl: `/${this.i18nStore.activeLang}/${ERoutes.OPEN_RESULT}?open_test_uuid=${measurement["open_test_uuid"]}`,
      downloadClass: this.classification.classify(
        measurement["download_kbit"],
        THRESHOLD_DOWNLOAD,
        "biggerBetter",
      ),
      download: measurement["download_kbit"]
        ? `${roundToSignificantDigits(measurement["download_kbit"] / 1000)} ${t(
            "Mbps",
          )}`
        : t(UNKNOWN),
      uploadClass: this.classification.classify(
        measurement["upload_kbit"],
        THRESHOLD_UPLOAD,
        "biggerBetter",
      ),
      upload: measurement["upload_kbit"]
        ? `${roundToSignificantDigits(measurement["upload_kbit"] / 1000)} ${t(
            "Mbps",
          )}`
        : t(UNKNOWN),
      pingClass: this.classification.classify(
        measurement["ping_ms"],
        THRESHOLD_PING,
        "smallerBetter",
      ),
      ping: measurement["ping_ms"]
        ? `${roundToSignificantDigits(measurement["ping_ms"])} ${t("millis")}`
        : t(UNKNOWN),
      ...(signal
        ? {
            signalClass: this.classification.classify(
              signal,
              signalThreshold,
              "biggerBetter",
            ),
          }
        : {}),
      signal: signal ? `${signal} ${t("dBm")}` : "",
      connection: measurement["platform"]
        ? measurement["platform"].trim()
        : t(UNKNOWN),
      operator: measurement["provider_name"] ?? t(UNKNOWN),
    }
    const tpl = await firstValueFrom(
      this.i18nStore.getLocalizedHtml("map-popup"),
    )
    return this.hydrate(tpl, data)
  }

  protected hydrate(
    tpl: string,
    data: Record<string, string | number | undefined>,
  ) {
    const t = this.i18nStore.translate.bind(this.i18nStore)
    for (const [key, val] of Object.entries(data)) {
      if (val && val.toString() !== t(UNKNOWN)) {
        tpl = tpl.replace(`{{${key}}}`, val.toString())

        if (key === "detailsUrl") {
          tpl = tpl.replace(
            `id="moreInfoButton"`,
            `id="moreInfoButton" onclick="window.open('${val.toString()}', '_blank')"`,
          )
        }
      }
    }

    for (const [id, placeholder] of Object.entries(POPUP_IDS_MAP)) {
      if (tpl.includes(placeholder)) {
        tpl = tpl.replace(`id="${id}"`, `id="${id}" style="display:none;"`)
      }
    }
    return tpl
  }
}
