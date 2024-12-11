import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { IUserSetingsResponse } from "../interfaces/user-settings-response.interface"
import { environment } from "../../../../environments/environment"
import { firstValueFrom, tap } from "rxjs"
import { UUID } from "../constants/strings"
import { v4 } from "uuid"
import { I18nStore } from "../../i18n/store/i18n.store"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
import { SimpleHistoryResult } from "../dto/simple-history-result.dto"
import { IPaginator } from "../../tables/interfaces/paginator.interface"
import {
  IOpenTestResultRequest,
  ITestResultRequest,
} from "../interfaces/measurement-result.interface"
dayjs.extend(utc)
dayjs.extend(tz)

@Injectable({
  providedIn: "root",
})
export class TestRepositoryService {
  constructor(
    private readonly http: HttpClient,
    private readonly i18nStore: I18nStore
  ) {}

  getSettings() {
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

  async getOpenResult(params: IOpenTestResultRequest) {
    const { openTestUuid } = params
    if (!openTestUuid) {
      throw new Error("Open Test UUID is required")
    }
    return await firstValueFrom(
      this.http.get(
        `${environment.api.cloud}/RMBTStatisticServer/opentests/${openTestUuid}`
      )
    )
  }

  async getResult(params: ITestResultRequest) {
    const { testUuid } = params
    if (!testUuid) {
      throw new Error("Test UUID is required")
    }
    const body = {
      test_uuid: testUuid,
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

    return [response, testResultDetail]
  }

  async getHistory(paginator?: IPaginator) {
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
}
