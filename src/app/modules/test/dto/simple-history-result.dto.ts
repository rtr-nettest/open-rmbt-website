import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import timezone from "dayjs/plugin/timezone" // dependent on utc plugin
dayjs.extend(utc)
dayjs.extend(timezone)

import { IPing } from "../interfaces/measurement-result.interface"
import { IOverallResult } from "../interfaces/overall-result.interface"
import {
  ISimpleHistoryResult,
  ISimpleHistoryTestLocation,
  ISimpleHistoryTestMetric,
} from "../interfaces/simple-history-result.interface"
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
import { FORMATTED_FIELDS } from "../constants/formatted-details-fields"
import { INITIAL_FIELDS } from "../constants/initial-details-fields"
import { SKIPPED_FIELDS } from "../constants/skipped-details-fields"
import { RESULT_DATE_FORMAT } from "../constants/strings"
import { SEARCHED_FIELDS } from "../constants/searched-details-fields"

export class SimpleHistoryResult implements ISimpleHistoryResult {
  // static fromRTRHistoryResult(response: any) {
  //   const downKbit = response.speed_download
  //     ? parseFloat(response.speed_download.replace(",", "")) * 1e3
  //     : 0
  //   const upKbit = response.speed_upload
  //     ? parseFloat(response.speed_upload.replace(",", "")) * 1e3
  //     : 0
  //   const pingMs = response.ping
  //     ? parseFloat(response.ping.replace(",", ""))
  //     : 0
  //   return new SimpleHistoryResult(
  //     dayjs(response?.time).tz(response.timezone).format(RESULT_DATE_FORMAT),
  //     "",
  //     downKbit,
  //     upKbit,
  //     pingMs,
  //     "",
  //     "",
  //     response.test_uuid ?? "",
  //     response.loop_uuid ?? "",
  //     false,
  //     [],
  //     [],
  //     [],
  //     ClassificationService.I.classify(
  //       downKbit,
  //       THRESHOLD_DOWNLOAD,
  //       "biggerBetter"
  //     ),
  //     ClassificationService.I.classify(
  //       upKbit,
  //       THRESHOLD_UPLOAD,
  //       "biggerBetter"
  //     ),
  //     ClassificationService.I.classify(
  //       pingMs * 1e6,
  //       THRESHOLD_PING,
  //       "smallerBetter"
  //     )
  //   )
  // }

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
            .utc(true)
            .tz(dayjs.tz.guess())
            .format(RESULT_DATE_FORMAT)
        : "",
      openTestsResponse?.server_name,
      {
        value: openTestsResponse?.download_kbit || 0,
        chart: CalcService.I.getOverallResultsFromSpeedCurve(
          openTestsResponse?.speed_curve.download
        ),
        classification:
          openTestsResponse?.download_classification ??
          ClassificationService.I.classify(
            openTestsResponse?.download_kbit,
            THRESHOLD_DOWNLOAD,
            "biggerBetter"
          ),
      },
      {
        value: openTestsResponse?.upload_kbit || 0,
        chart: CalcService.I.getOverallResultsFromSpeedCurve(
          openTestsResponse?.speed_curve.upload
        ),
        classification:
          openTestsResponse?.upload_classification ??
          ClassificationService.I.classify(
            openTestsResponse?.upload_kbit,
            THRESHOLD_UPLOAD,
            "biggerBetter"
          ),
      },
      {
        value: openTestsResponse?.ping_ms || 0,
        chart: CalcService.I.getOverallPings(
          openTestsResponse?.speed_curve.ping
        ),
        classification:
          openTestsResponse?.ping_classification ??
          ClassificationService.I.classify(
            openTestsResponse?.ping_ms * 1e6,
            THRESHOLD_PING,
            "smallerBetter"
          ),
      },
      {
        value:
          (openTestsResponse?.signal_strength || openTestsResponse?.lte_rsrp) &&
          openTestsResponse?.cat_technology !== null
            ? openTestsResponse.lte_rsrp
            : openTestsResponse.signal_strength,
        classification: openTestsResponse?.signal_classification,
        metric: openTestsResponse?.cat_technology
          ? openTestsResponse?.cat_technology
              .toLowerCase()
              .replaceAll("wlan", "wlan4")
          : undefined,
        tags:
          openTestsResponse?.signal_strength &&
          openTestsResponse?.lte_rsrp &&
          openTestsResponse?.cat_technology !== null
            ? ["lte_rsrp"]
            : [],
      },
      openTestsResponse?.public_ip_as_name,
      openTestsResponse?.ip_anonym,
      uuid,
      response?.loop_uuid,
      false,
      openTestsResponse?.long && openTestsResponse?.lat
        ? [openTestsResponse.long, openTestsResponse.lat]
        : undefined,
      openTestsResponse.speed_curve?.location,
      trd
    )
  }

  static fillDetailsFromOpenTestResult(openTestsResponse: any, t: Translation) {
    const trd: IDetailedHistoryResultItem[] = []
    let entries = new Array(Object.entries(openTestsResponse).length)
    const entriesMap = new Map(Object.entries(openTestsResponse))
    const initialKeys = [...INITIAL_FIELDS]
    for (let i = 0; i < initialKeys.length; i++) {
      entries[i] = [initialKeys[i], openTestsResponse[initialKeys[i]]]
      entriesMap.delete(initialKeys[i])
    }
    entries = [...entries, ...entriesMap].filter((v) => !!v)

    trd.push({
      title: "location",
      value: `${formatcoords(
        openTestsResponse.lat,
        openTestsResponse.long
      ).format(LOC_FORMAT)} (${
        openTestsResponse.loc_src ? `${openTestsResponse.loc_src}, ` : ""
      } +/- ${Math.round(openTestsResponse.loc_accuracy)}m)`,
      mappable: true,
      mapProps: {
        coordinates: [openTestsResponse.long, openTestsResponse.lat],
        accuracy: openTestsResponse.loc_accuracy,
        distance: openTestsResponse.distance,
      },
      initial: true,
    })

    for (const [key, value] of entries) {
      if (SKIPPED_FIELDS.has(key) || !value) {
        continue
      }
      const v = FORMATTED_FIELDS[key]
        ? FORMATTED_FIELDS[key](openTestsResponse, t)
        : value
      const initial = INITIAL_FIELDS.has(key)
      const searchable = SEARCHED_FIELDS[key] !== undefined
      const searchTerm = SEARCHED_FIELDS[key]
        ? SEARCHED_FIELDS[key](openTestsResponse)
        : undefined
      if (key === "land_cover") {
        trd.push({
          title: "land_cover_cat1",
          value: FORMATTED_FIELDS["land_cover_cat1"]!(openTestsResponse, t),
        })
        trd.push({
          title: "land_cover_cat2",
          value: FORMATTED_FIELDS["land_cover_cat2"]!(openTestsResponse, t),
        })
      }
      trd.push({
        title: key,
        value: `${v}`,
        searchable,
        searchTerm,
        initial,
      })
    }
    return trd
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
    public isLocal?: boolean,
    public coordinates?: [number, number],
    public locationTable?: ISimpleHistoryTestLocation[],
    public detailedHistoryResult?: IDetailedHistoryResultItem[]
  ) {}
}
