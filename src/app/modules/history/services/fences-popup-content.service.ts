import { Injectable } from "@angular/core"
import {
  PopupContentService,
  UNKNOWN,
} from "../../map/services/popup-content.service"
import {
  GSM_CONNECTION_TYPES,
  LTE_CONNECTION_TYPES,
  THRESHOLD_PING,
  THRESHOLD_SIGNAL_GSM,
  THRESHOLD_SIGNAL_LTE,
  THRESHOLD_SIGNAL_WLAN,
} from "../../shared/services/classification.service"
import { getMobileNetworkTechnology } from "../constants/network-technology"
import { RESULT_DATE_FORMAT } from "../../test/constants/strings"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
import { roundToSignificantDigits } from "../../shared/util/math"

dayjs.extend(utc)
dayjs.extend(tz)

type PopupData = {
  time: string
  offset: string
  duration: string
  radius: string
  pingClass: number
  ping: string
  signalClass?: number
  signal?: string
  connection: string
}

@Injectable({
  providedIn: "root",
})
export class FencesPopupContentService extends PopupContentService {
  override loadTemplate() {
    this.i18nStore.getLocalizedHtml("fences-map-popup").subscribe((html) => {
      this.tpl = html
    })
  }

  override getSingleMeasurement(measurement: Record<string, any>): string {
    const t = this.i18nStore.translate.bind(this.i18nStore)
    const technology = getMobileNetworkTechnology(measurement["technology_id"])
    const signal = measurement["signal"]
    let signalThreshold = THRESHOLD_SIGNAL_LTE
    for (const ct of GSM_CONNECTION_TYPES) {
      if (technology === ct) {
        signalThreshold = THRESHOLD_SIGNAL_GSM
        break
      }
    }
    const data: PopupData = {
      time: measurement["fence_time"]
        ? dayjs(measurement["fence_time"]).format(RESULT_DATE_FORMAT)
        : t(UNKNOWN),
      pingClass: this.classification.classify(
        measurement["avg_ping_ms"],
        THRESHOLD_PING,
        "smallerBetter",
      ),
      ping: measurement["avg_ping_ms"]
        ? `${roundToSignificantDigits(measurement["avg_ping_ms"])} ${t("millis")}`
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
      signal: signal ? `${signal} ${t("dBm")}` : t(UNKNOWN),
      connection: technology ? t(technology) : t(UNKNOWN),
      offset: measurement["offset_ms"]
        ? `${Math.round(measurement["offset_ms"] / 1e3)} ${t("s")}`
        : t(UNKNOWN),
      duration: measurement["duration_ms"]
        ? `${Math.round(measurement["duration_ms"] / 1e3)} ${t("s")}`
        : t(UNKNOWN),
      radius: measurement["radius"]
        ? `${Math.round(measurement["radius"])} ${t("m")}`
        : t(UNKNOWN),
    }
    let tpl = this.tpl
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
