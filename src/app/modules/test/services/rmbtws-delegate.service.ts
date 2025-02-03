import { Injectable } from "@angular/core"
import { TestStore } from "../store/test.store"
import { BasicNetworkInfo } from "../dto/basic-network-info.dto"

@Injectable({
  providedIn: "root",
})
export class RmbtwsDelegateService {
  constructor(private readonly testStore: TestStore) {}

  draw() {}

  updateInfo(
    serverName: string,
    remoteIp: string,
    providerName: string,
    testUuid: string,
    openTestUuid: string
  ) {
    this.testStore.basicNetworkInfo.set(
      new BasicNetworkInfo(
        serverName,
        remoteIp,
        providerName,
        testUuid,
        openTestUuid
      )
    )
  }

  setLocation(lat: number, lon: number) {
    const info = this.testStore.basicNetworkInfo()
    info.coordinates = [lon, lat]
    this.testStore.basicNetworkInfo.set(info)
  }
}
