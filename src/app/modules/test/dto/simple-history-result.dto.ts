import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone" // dependent on utc plugin
dayjs.extend(utc)
dayjs.extend(timezone)

import { IPing } from "../interfaces/measurement-result.interface"
import { IOverallResult } from "../interfaces/overall-result.interface"
import { ISimpleHistoryResult } from "../interfaces/simple-history-result.interface"
import { IDetailedHistoryResultItem } from "../interfaces/detailed-history-result-item.interface"
import {
  ClassificationService,
  THRESHOLD_DOWNLOAD,
  THRESHOLD_PING,
  THRESHOLD_UPLOAD,
} from "../../shared/services/classification.service"
import { CalcService } from "../services/calc.service"
import formatcoords from "formatcoords"
import { LOC_FORMAT } from "../../shared/pipes/lonlat.pipe"
import { Translation } from "../../i18n/store/i18n.store"
import {
  FORMATTED_KEYS,
  INITIAL_KEYS,
  RESULT_DATE_FORMAT,
  SEARCHED_KEYS,
  SKIPPED_KEYS,
} from "../constants/detailed-results"

export class SimpleHistoryResult implements ISimpleHistoryResult {
  static fromRTRHistoryResult(response: any) {
    const downKbit = response.speed_download
      ? parseFloat(response.speed_download.replace(",", "")) * 1e3
      : 0
    const upKbit = response.speed_upload
      ? parseFloat(response.speed_upload.replace(",", "")) * 1e3
      : 0
    const pingMs = response.ping
      ? parseFloat(response.ping.replace(",", ""))
      : 0
    return new SimpleHistoryResult(
      dayjs(response?.time).tz(response.timezone).format(RESULT_DATE_FORMAT),
      "",
      downKbit,
      upKbit,
      pingMs,
      "",
      "",
      response.test_uuid ?? "",
      response.loop_uuid ?? "",
      false,
      [],
      [],
      [],
      ClassificationService.I.classify(
        downKbit,
        THRESHOLD_DOWNLOAD,
        "biggerBetter"
      ),
      ClassificationService.I.classify(
        upKbit,
        THRESHOLD_UPLOAD,
        "biggerBetter"
      ),
      ClassificationService.I.classify(
        pingMs * 1e6,
        THRESHOLD_PING,
        "smallerBetter"
      )
    )
  }

  static fromOpenTestResult(
    uuid: string,
    response: any,
    openTestsResponse: any,
    translations: Translation
  ) {
    const trd: IDetailedHistoryResultItem[] =
      SimpleHistoryResult.fillDetailsFromOpenTestResult(
        openTestsResponse,
        translations
      )
    return new SimpleHistoryResult(
      openTestsResponse?.time
        ? dayjs(openTestsResponse.time, RESULT_DATE_FORMAT)
            .utc()
            .format(RESULT_DATE_FORMAT)
        : "",
      openTestsResponse?.server_name,
      openTestsResponse?.download_kbit || 0,
      openTestsResponse?.upload_kbit || 0,
      openTestsResponse?.ping_ms || 0,
      openTestsResponse?.public_ip_as_name,
      openTestsResponse?.ip_anonym,
      uuid,
      response?.loop_uuid,
      false,
      CalcService.I.getOverallResultsFromSpeedCurve(
        openTestsResponse?.speed_curve.download
      ),
      CalcService.I.getOverallResultsFromSpeedCurve(
        openTestsResponse?.speed_curve.upload
      ),
      CalcService.I.getOverallPings(openTestsResponse?.speed_curve.ping),
      openTestsResponse?.download_classification ??
        ClassificationService.I.classify(
          openTestsResponse?.download_kbit,
          THRESHOLD_DOWNLOAD,
          "biggerBetter"
        ),
      openTestsResponse?.upload_classification ??
        ClassificationService.I.classify(
          openTestsResponse?.upload_kbit,
          THRESHOLD_UPLOAD,
          "biggerBetter"
        ),
      openTestsResponse?.ping_classification ??
        ClassificationService.I.classify(
          openTestsResponse?.ping_ms * 1e6,
          THRESHOLD_PING,
          "smallerBetter"
        ),
      openTestsResponse?.long && openTestsResponse?.lat
        ? [openTestsResponse.long, openTestsResponse.lat]
        : undefined,
      trd
    )
  }

  static fillDetailsFromOpenTestResult(openTestsResponse: any, t: Translation) {
    const trd: IDetailedHistoryResultItem[] = []
    for (const [key, value] of Object.entries(openTestsResponse)) {
      if (SKIPPED_KEYS.has(key) || !value) {
        continue
      }
      const v = FORMATTED_KEYS[key]
        ? FORMATTED_KEYS[key](openTestsResponse, t)
        : value
      const initial = INITIAL_KEYS.has(key)
      const searchable = SEARCHED_KEYS[key] !== undefined
      const searchTerm = SEARCHED_KEYS[key]
        ? SEARCHED_KEYS[key](openTestsResponse)
        : undefined
      trd.push({
        title: key,
        value: `${v}`,
        searchable,
        searchTerm,
        initial,
      })
    }

    trd.push({
      title: "location",
      value: `${formatcoords(
        openTestsResponse.lat,
        openTestsResponse.long
      ).format(LOC_FORMAT)} (${openTestsResponse.loc_src}, +/- ${
        openTestsResponse.loc_accuracy
      }m)`,
      mappable: true,
      coordinates: [openTestsResponse.long, openTestsResponse.lat],
      initial: true,
    })
    return trd
  }

  constructor(
    public measurementDate: string,
    public measurementServerName: string,
    public downloadKbit: number,
    public uploadKbit: number,
    public ping: number,
    public providerName: string,
    public ipAddress: string,
    public testUuid?: string,
    public loopUuid?: string,
    public isLocal?: boolean,
    public downloadOverTime?: IOverallResult[],
    public uploadOverTime?: IOverallResult[],
    public pingOverTime?: IPing[],
    public downloadClass?: number,
    public uploadClass?: number,
    public pingClass?: number,
    public coordinates?: [number, number],
    public detailedHistoryResult?: IDetailedHistoryResultItem[]
  ) {}
}
