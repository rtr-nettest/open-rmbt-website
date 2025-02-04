import { BasicNetworkInfo } from "../dto/basic-network-info.dto"
import { IBasicNetworkInfo } from "../interfaces/basic-network-info.interface"
export class RmbtwsDelegateService {
  constructor(
    private readonly getFunc: () => IBasicNetworkInfo,
    private readonly setFunc: (newValue: IBasicNetworkInfo) => void
  ) {}

  draw() {}

  updateInfo(
    serverName: string,
    remoteIp: string,
    providerName: string,
    testUuid: string,
    openTestUuid: string
  ) {
    this.setFunc(
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
    const info = this.getFunc()
    info.coordinates = [lon, lat]
    this.setFunc(info)
  }
}
