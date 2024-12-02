import { HttpClient } from "@angular/common/http"
import {
  Inject,
  Injectable,
  isDevMode,
  NgZone,
  PLATFORM_ID,
} from "@angular/core"
import { IUserSetingsResponse } from "../interfaces/user-settings-response.interface"
import { environment } from "../../../../environments/environment"
import { firstValueFrom, Observable, of, tap } from "rxjs"
import { isPlatformBrowser } from "@angular/common"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
import { IMeasurementPhaseState } from "../interfaces/measurement-phase-state.interface"
import { IBasicNetworkInfo } from "../interfaces/basic-network-info.interface"
import { EMeasurementStatus } from "../constants/measurement-status.enum"
import { IPing } from "../interfaces/measurement-result.interface"
import { IOverallResult } from "../interfaces/overall-result.interface"
import { I18nStore } from "../../i18n/store/i18n.store"
import { SimpleHistoryResult } from "../dto/simple-history-result.dto"
import { IPaginator } from "../../tables/interfaces/paginator.interface"
dayjs.extend(utc)
dayjs.extend(tz)

export const UUID = "RTR_NETZTEST_UUID"

@Injectable({
  providedIn: "root",
})
export class TestService {
  private downs: IOverallResult[] = []
  private ups: IOverallResult[] = []
  private pings: IPing[] = []
  private lastProgress = -1
  private lastStatus: EMeasurementStatus = EMeasurementStatus.NOT_STARTED
  private rmbtws: any
  private rmbtTest: any
  private startTimeMs = 0
  private endTimeMs = 0
  private serverName?: string
  private remoteIp?: string
  private providerName?: string
  private testUuid?: string

  constructor(
    private readonly http: HttpClient,
    private readonly i18nStore: I18nStore,
    private readonly ngZone: NgZone,
    @Inject(PLATFORM_ID) private readonly platformId: object
  ) {
    if (isPlatformBrowser(this.platformId)) {
      const promise = isDevMode()
        ? import("rmbtws/dist/rmbtws.js" as any)
        : import("rmbtws" as any)
      promise.then((rmbtws) => {
        this.rmbtws = rmbtws
        this.rmbtTest = rmbtws.RMBTTest
      })
    }
  }

  getSettings(uuid?: string): Observable<IUserSetingsResponse> {
    if (environment.baseUrl.includes("localhost")) {
      return of({
        error: [],
        settings: [{ terms_and_conditions: { version: 5 } }],
      })
    }
    return this.http
      .post<IUserSetingsResponse>(
        `${environment.api.baseUrl}/RMBTControlServer/settings`,
        { type: "DESKTOP", name: "RTR-Netztest", uuid }
      )
      .pipe(
        tap((settings) => {
          if (globalThis.localStorage && settings?.settings[0]?.uuid) {
            localStorage.setItem(UUID, settings?.settings[0]?.uuid)
          }
        })
      )
  }

  launchTest() {
    this.resetState()
    if (!isPlatformBrowser(this.platformId)) {
      return of(null)
    }
    const uuid = localStorage.getItem(UUID)
    if (!uuid) {
      return of(null)
    }
    return this.getSettings(uuid).pipe(
      tap(() => {
        if (!this.rmbtws) {
          return
        }
        this.ngZone.runOutsideAngular(() => {
          this.rmbtws.TestEnvironment.init(this, null)
          const config = new this.rmbtws.RMBTTestConfig(
            "en",
            environment.api.baseUrl,
            ""
          )
          config.uuid = uuid
          config.timezone = dayjs.tz.guess()
          config.additionalSubmissionParameters = { network_type: 0 }
          const ctrl = new this.rmbtws.RMBTControlServerCommunication(config)

          this.startTimeMs = Date.now()
          const websocketTest = new this.rmbtws.RMBTTest(config, ctrl)
          websocketTest.startTest()
        })
      })
    )
  }

  async getMeasurementState(): Promise<
    IMeasurementPhaseState & IBasicNetworkInfo
  > {
    const result = this.rmbtTest?.getIntermediateResult()
    const phase: EMeasurementStatus =
      result?.status?.toString() ?? EMeasurementStatus.NOT_STARTED
    const down =
      result?.downBitPerSec && result.downBitPerSec !== -1
        ? (result.downBitPerSec as number) / 1e6
        : -1
    if (down >= 0) {
      this.downs.push({
        speed: result.downBitPerSec,
        bytes: 0,
        nsec: result.diffTime * 1e9,
      })
    }
    const up =
      result?.upBitPerSec && result.upBitPerSec !== -1
        ? (result.upBitPerSec as number) / 1e6
        : -1
    if (up >= 0) {
      this.ups.push({
        speed: result.upBitPerSec,
        bytes: 0,
        nsec: result.diffTime * 1e9,
      })
    }
    const ping =
      result.pingNano && result.pingNano !== -1
        ? Math.round((result.pingNano as number) / 1e6)
        : -1
    if (ping >= 0) {
      this.pings.push({
        value_server: result.pingNano,
        value: result.pingNano,
        time_ns: result.diffTime * 1e9,
      })
    }
    const progress = Math.round(result.progress * 100)

    this.lastProgress = result?.progress
    this.lastStatus = phase

    return {
      duration: result.diffTime,
      progress,
      time: Date.now(),
      ping,
      pings: this.pings,
      down,
      downs: this.downs ?? [],
      up,
      ups: this.ups ?? [],
      phase,
      testUuid: this.testUuid ?? "",
      ipAddress: this.remoteIp ?? "-",
      serverName: this.serverName ?? "-",
      providerName: this.providerName ?? "-",
      startTimeMs: this.startTimeMs,
      endTimeMs: this.endTimeMs,
    }
  }

  async getMeasurementResult(uuid: string) {
    const body = {
      test_uuid: uuid,
      timezone: dayjs.tz.guess(),
      capabilities: { classification: { count: 4 } },
    }
    let response = (await firstValueFrom(
      this.http.post(
        `${environment.api.baseUrl}/RMBTControlServer/testresult`,
        body
      )
    )) as any
    if (response?.testresult?.length) {
      response = response.testresult[0]
    }

    // Test metadata

    let testResultDetail = (await firstValueFrom(
      this.http.post(
        `${environment.api.baseUrl}/RMBTControlServer/testresultdetail`,
        {
          ...body,
          language: this.i18nStore.activeLang,
        }
      )
    )) as any

    // Graphs

    let openTestsResponse: any
    if (response && response.status != "error") {
      openTestsResponse = await this.http.get(
        `${environment.baseUrl}/RMBTStatisticServer/opentests/${response.open_test_uuid}?capabilities={"classification":{"count":4}}`
      )
    }

    return SimpleHistoryResult.fromRTRMeasurementResult(
      uuid,
      response,
      openTestsResponse,
      testResultDetail
    )
  }

  async getMeasurementHistory(paginator?: IPaginator) {
    const body: { [key: string]: any } = {
      language: this.i18nStore.activeLang,
      timezone: dayjs.tz.guess(),
      uuid: localStorage.getItem(UUID),
      result_offset: paginator?.offset,
      include_failed_tests: true,
    }
    if (paginator?.limit) {
      body["result_limit"] = paginator.limit
    }
    const resp: any = await firstValueFrom(
      this.http.post(
        `${environment.api.baseUrl}/RMBTControlServer/history`,
        body
      )
    )
    if (resp?.error.length) {
      throw new Error(resp.error)
    }
    if (resp?.history.length) {
      return resp.history.map((hi: any) =>
        SimpleHistoryResult.fromRTRHistoryResult(hi)
      )
    }
  }

  updateStartTime() {
    this.startTimeMs = this.endTimeMs || this.startTimeMs
    this.endTimeMs = Date.now()
  }

  abortMeasurement() {
    // TODO:
  }

  private resetState() {
    this.downs = []
    this.ups = []
    this.pings = []
    this.lastProgress = -1
    this.lastStatus = EMeasurementStatus.NOT_STARTED
    this.startTimeMs = 0
    this.endTimeMs = 0
    this.serverName = undefined
    this.remoteIp = undefined
    this.providerName = undefined
    this.testUuid = undefined
  }

  /** RMBTws delegate */
  draw() {}
  updateInfo(
    serverName: string,
    remoteIp: string,
    providerName: string,
    testUuid: string
  ) {
    this.serverName = serverName
    this.remoteIp = remoteIp
    this.providerName = providerName
    this.testUuid = testUuid
  }
  /** End RMBTws delegate */
}
