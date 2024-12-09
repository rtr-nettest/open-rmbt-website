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
import { v4 } from "uuid"
dayjs.extend(utc)
dayjs.extend(tz)

export const UUID = "RMBTuuid"

@Injectable({
  providedIn: "root",
})
export class TestService {
  private downs: IOverallResult[] = []
  private ups: IOverallResult[] = []
  private pings: IPing[] = []
  private rmbtws: any
  private rmbtTest: any
  private startTimeMs = 0
  private endTimeMs = 0
  private serverName?: string
  private remoteIp?: string
  private providerName?: string
  private testUuid?: string
  private stateChangeMs = 0

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
      })
    }
  }

  getSettings(): Observable<IUserSetingsResponse> {
    if (!isPlatformBrowser(this.platformId)) {
      return of({ settings: [] } as unknown as IUserSetingsResponse)
    }
    const uuid = localStorage.getItem(UUID) ?? v4()
    return this.http
      .post<IUserSetingsResponse>(
        `${environment.api.baseUrl}/RMBTControlServer/settings`,
        {
          language: "en",
          name: "RTR-Netztest",
          terms_and_conditions_accepted: "true",
          terms_and_conditions_accepted_version: 6,
          type: "DESKTOP",
          version_code: "1",
          version_name: "0.1",
        }
      )
      .pipe(
        tap((settings) => {
          localStorage.setItem(UUID, settings?.settings[0]?.uuid ?? uuid)
        })
      )
  }

  launchTest() {
    this.resetState()
    if (!isPlatformBrowser(this.platformId) || !this.rmbtws) {
      console.error("RMBTws not loaded")
      return
    }
    return this.ngZone.runOutsideAngular(() => {
      this.rmbtws.TestEnvironment.init(this, null)
      const config = new this.rmbtws.RMBTTestConfig(
        "en",
        environment.api.baseUrl,
        `RMBTControlServer`
      )
      config.uuid = localStorage.getItem(UUID)
      config.timezone = dayjs.tz.guess()
      config.additionalSubmissionParameters = { network_type: 0 }
      const ctrl = new this.rmbtws.RMBTControlServerCommunication(config)

      this.startTimeMs = Date.now()
      this.rmbtTest = new this.rmbtws.RMBTTest(config, ctrl)
      this.rmbtTest.startTest()
      this.rmbtTest.onStateChange(() => {
        this.stateChangeMs = Date.now()
      })
    })
  }

  async getMeasurementState(): Promise<
    IMeasurementPhaseState & IBasicNetworkInfo
  > {
    const result = this.rmbtTest?.getIntermediateResult()
    const diffTimeMs = Date.now() - this.stateChangeMs
    const phase: EMeasurementStatus =
      result?.status?.toString() ?? EMeasurementStatus.NOT_STARTED
    const down =
      result?.downBitPerSec && result.downBitPerSec !== -1
        ? (result.downBitPerSec as number) / 1e6
        : -1
    if (down >= 0 && phase === EMeasurementStatus.DOWN) {
      this.downs.push({
        speed: result.downBitPerSec,
        bytes: 0,
        nsec: diffTimeMs * 1e6,
      })
    }
    const up =
      result?.upBitPerSec && result.upBitPerSec !== -1
        ? (result.upBitPerSec as number) / 1e6
        : -1
    if (up >= 0 && phase === EMeasurementStatus.UP) {
      this.ups.push({
        speed: result.upBitPerSec,
        bytes: 0,
        nsec: diffTimeMs * 1e6,
      })
    }
    const ping =
      result?.pingNano && result?.pingNano !== -1
        ? Math.round((result.pingNano as number) / 1e6)
        : -1
    if (ping >= 0 && phase === EMeasurementStatus.PING) {
      this.pings.push({
        value_server: result.pingNano,
        value: result.pingNano,
        time_ns: diffTimeMs * 1e6,
      })
    }

    return {
      duration: diffTimeMs / 1e3,
      progress: result.progress,
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
      openTestsResponse = await firstValueFrom(
        this.http.get(
          `${environment.baseUrl}/RMBTStatisticServer/opentests/${response.open_test_uuid}?capabilities={"classification":{"count":4}}`
        )
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
  setLocation(lat: number, lon: number) {
    console.log("Location", lat, lon)
  }
  /** End RMBTws delegate */
}
