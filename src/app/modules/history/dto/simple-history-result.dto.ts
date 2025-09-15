import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone" // dependent on utc plugin
dayjs.extend(utc)
dayjs.extend(timezone)

import {
  ISimpleHistoryResult,
  ISimpleHistoryTestMetric,
} from "../interfaces/simple-history-result.interface"
import {
  ClassificationService,
  THRESHOLD_DOWNLOAD,
  THRESHOLD_PING,
  THRESHOLD_UPLOAD,
} from "../../shared/services/classification.service"
import { CalcService } from "../services/calc.service"
import { RESULT_DATE_FORMAT } from "../../test/constants/strings"
import { IQoeItem } from "../interfaces/qoe-item.interface"

export class SimpleHistoryResult implements ISimpleHistoryResult {
  static fromHistoryResponse(response: any) {
    const down =
      (!response?.speed_download && response?.speed_download != 0) ||
      response.speed_download.trim() === ""
        ? null
        : parseFloat(response.speed_download.replace(",", ""))
    const up =
      (!response?.speed_upload && response?.speed_upload != 0) ||
      response.speed_upload.trim() === ""
        ? null
        : parseFloat(response.speed_upload.replace(",", ""))
    const ping =
      (!response?.ping && response?.ping != 0) || response.ping.trim() === ""
        ? null
        : parseFloat(response.ping.replace(",", ""))
    return new SimpleHistoryResult(
      response?.time
        ? dayjs(response.time)
            .utc()
            .tz(dayjs.tz.guess())
            .format(RESULT_DATE_FORMAT)
        : "",
      "",
      {
        value: down,
        classification:
          down != null
            ? ClassificationService.I.classify(
                down * 1e3,
                THRESHOLD_DOWNLOAD,
                "biggerBetter"
              )
            : null,
      },
      {
        value: up,
        classification:
          up != null
            ? ClassificationService.I.classify(
                up * 1e3,
                THRESHOLD_UPLOAD,
                "biggerBetter"
              )
            : null,
      },
      {
        value: ping,
        classification:
          ping != null
            ? ClassificationService.I.classify(
                ping,
                THRESHOLD_PING,
                "smallerBetter"
              )
            : null,
      },
      {
        value: response?.signal_strength
          ? parseFloat(response.signal_strength)
          : 0,
        classification: response?.signal_classification,
      },
      "",
      "",
      response?.test_uuid,
      response?.loop_uuid,
      {
        openTestUuid: response?.open_test_uuid,
        device: response?.model,
        networkType: response?.network_type,
        status: response?.status,
      }
    )
  }

  static fromOpenTestResponse(
    uuid: string,
    response: any,
    openTestResponse: any
  ) {
    return new SimpleHistoryResult(
      openTestResponse?.time
        ? dayjs(openTestResponse.time, RESULT_DATE_FORMAT)
            .utc(true)
            .tz(dayjs.tz.guess())
            .format(RESULT_DATE_FORMAT)
        : "",
      openTestResponse?.server_name,
      {
        value: openTestResponse?.download_kbit || 0,
        chart: CalcService.I.getOverallResultsFromSpeedCurve(
          openTestResponse?.speed_curve.download
        ),
        classification: ClassificationService.I.classify(
          openTestResponse?.download_kbit,
          THRESHOLD_DOWNLOAD,
          "biggerBetter"
        ),
      },
      {
        value: openTestResponse?.upload_kbit || 0,
        chart: CalcService.I.getOverallResultsFromSpeedCurve(
          openTestResponse?.speed_curve.upload
        ),
        classification: ClassificationService.I.classify(
          openTestResponse?.upload_kbit,
          THRESHOLD_UPLOAD,
          "biggerBetter"
        ),
      },
      {
        value: openTestResponse?.ping_ms || 0,
        chart: CalcService.I.getOverallPings(
          openTestResponse?.speed_curve.ping
        ),
        classification: ClassificationService.I.classify(
          openTestResponse?.ping_ms,
          THRESHOLD_PING,
          "smallerBetter"
        ),
      },
      {
        value:
          openTestResponse?.lte_rsrp &&
          openTestResponse?.cat_technology !== null
            ? openTestResponse?.lte_rsrp
            : openTestResponse?.signal_strength,
        chart: openTestResponse?.speed_curve?.signal?.length
          ? openTestResponse?.speed_curve?.signal
          : undefined,
        classification: openTestResponse?.signal_classification,
        metric: openTestResponse?.cat_technology
          ? openTestResponse?.cat_technology
              .toLowerCase()
              .replaceAll("wlan", "wlan4")
          : undefined,
        tags:
          openTestResponse?.signal_strength &&
          openTestResponse?.lte_rsrp &&
          openTestResponse?.cat_technology !== null
            ? ["lte_rsrp"]
            : [],
      },
      openTestResponse?.public_ip_as_name,
      openTestResponse?.ip_anonym,
      uuid,
      response?.loop_uuid,
      openTestResponse,
      response?.qoe_classification || openTestResponse?.qoe_classification
    )
  }

  constructor(
    public measurementDate: string,
    public measurementServerName: string,
    public download: ISimpleHistoryTestMetric,
    public upload: ISimpleHistoryTestMetric,
    public ping: ISimpleHistoryTestMetric,
    public signal: ISimpleHistoryTestMetric | undefined,
    public providerName: string,
    public ipAddress: string,
    public testUuid?: string,
    public loopUuid?: string,
    public openTestResponse?: { [key: string]: any },
    public qoeClassification?: IQoeItem[]
  ) {}
}
