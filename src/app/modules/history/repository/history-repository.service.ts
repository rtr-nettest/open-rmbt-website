import { HttpClient } from "@angular/common/http"
import { Injectable } from "@angular/core"
import { I18nStore } from "../../i18n/store/i18n.store"
import {
  IOpenTestResultRequest,
  ITestResultRequest,
} from "../interfaces/measurement-result.interface"
import { firstValueFrom } from "rxjs"
import { environment } from "../../../../environments/environment"
import { IPaginator } from "../../tables/interfaces/paginator.interface"
import { UUID } from "../../test/constants/strings"
import { ICoverageResponse } from "../interfaces/coverage.interface"
import dayjs from "dayjs"
import utc from "dayjs/plugin/utc"
import tz from "dayjs/plugin/timezone"
import { MainStore } from "../../shared/store/main.store"
dayjs.extend(utc)
dayjs.extend(tz)

@Injectable({
  providedIn: "root",
})
export class HistoryRepositoryService {
  constructor(
    private readonly http: HttpClient,
    private readonly i18nStore: I18nStore,
    private readonly mainStore: MainStore
  ) {}

  async getOpenResult(params: IOpenTestResultRequest) {
    const { openTestUuid } = params
    if (!openTestUuid) {
      return null
    }
    return await firstValueFrom(
      this.http.get(
        `${
          this.mainStore.api().url_web_statistic_server
        }/opentests/${openTestUuid}`
      )
    )
  }

  async getResult(params: ITestResultRequest) {
    const { testUuid } = params
    if (!testUuid) {
      return [null, null]
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
    const uuid = localStorage.getItem(UUID)
    if (!uuid) {
      return null
    }
    const body: { [key: string]: any } = {
      language: this.i18nStore.activeLang,
      timezone: dayjs.tz.guess(),
      uuid,
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
    return resp?.history
  }

  getCoverages(lon: number, lat: number) {
    return this.http.get<ICoverageResponse>(
      `${
        this.mainStore.api().url_web_statistic_server
      }/coverage?long=${lon}&lat=${lat}`
    )
  }
}
