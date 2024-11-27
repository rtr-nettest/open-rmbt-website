import { Injectable } from "@angular/core"

export const THRESHOLD_UPLOAD = [50000, 5000, 2500]
export const THRESHOLD_DOWNLOAD = [100000, 10000, 5000]
export const THRESHOLD_PING = [10000000, 25000000, 75000000]
export const THRESHOLD_SIGNAL_GSM = [-75, -85, -101]
export const THRESHOLD_SIGNAL_LTE = [-85, -95, -111]
export const THRESHOLD_SIGNAL_WLAN = [-51, -61, -76]
export const CLASSIFICATION_ITEMS = 4
export const GSM_CONNECTION_TYPES = [
  "2G",
  "2G/3G",
  "2G/3G/4G",
  "2G/4G",
  "3G",
  "3G/4G",
]
export const LTE_CONNECTION_TYPES = ["4G", "5G", "MOBILE"]
export const WLAN_CONNECTION_TYPES = ["CLI", "LAN", "WLAN"]

@Injectable({
  providedIn: "root",
})
export class ClassificationService {
  classify(
    value: number,
    threshold: number[],
    condition: "smallerBetter" | "biggerBetter"
  ) {
    threshold = threshold.sort((a, b) => b - a)
    let retVal = 1
    for (let i = 0; i < threshold.length; i++) {
      if (condition === "biggerBetter" && value >= threshold[i]) {
        retVal = CLASSIFICATION_ITEMS - i
        break
      } else if (condition === "smallerBetter" && value <= threshold[i]) {
        retVal++
      }
    }
    return Math.min(retVal, CLASSIFICATION_ITEMS)
  }
}
