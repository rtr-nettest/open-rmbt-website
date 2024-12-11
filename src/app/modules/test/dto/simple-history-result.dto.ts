import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone" // dependent on utc plugin
dayjs.extend(utc)
dayjs.extend(timezone)

import {
  IMeasurementResult,
  IPing,
} from "../interfaces/measurement-result.interface"
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

export const RESULT_DATE_FORMAT = "YYYY-MM-DD HH:mm:ss"

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
    testResultDetail: any
  ) {
    let trd: IDetailedHistoryResultItem[] = testResultDetail?.testresultdetail
      ? [...testResultDetail?.testresultdetail]
      : []
    trd = SimpleHistoryResult.fillDetailsFromOpenTestResult(
      trd,
      openTestsResponse
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

  static fillDetailsFromOpenTestResult(
    trd: IDetailedHistoryResultItem[],
    openTestsResponse: any
  ) {
    const skippedKeys = new Set([
      "time",
      "server_name",
      "download_kbit",
      "upload_kbit",
      "ping_ms",
      "public_ip_as_name",
      "ip_anonym",
      "speed_curve",
      "download_classification",
      "upload_classification",
      "ping_classification",
      "long",
      "lat",
    ])
    const searchableKeys: {
      [key: string]: null | ((testData: any) => string)
    } = {
      cat_technology: null,
      radio_band: null,
      network_name: null,
      provider_name: null,
      network_country: null,
      country_sim: (testData: any) => testData["sim_country"],
      country_geoip: (testData: any) => testData.country_geoip.toLowerCase(),
      public_ip_as_name: null,
      country_asn: (testData: any) => testData.country_asn.toLowerCase(),
      platform: null,
      model: null,
      client_version: null,
    }
    for (const [key, value] of Object.entries(openTestsResponse)) {
      if (skippedKeys.has(key) || value === null) {
        continue
      }
      if (key in searchableKeys) {
        trd.push({
          title: key,
          value: `${value}`,
          searchable: true,
          searchTerm: searchableKeys[key]
            ? searchableKeys[key](openTestsResponse)
            : null,
        })
        continue
      }
      trd.push({
        title: key,
        value: `${value}`,
      })
    }
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
