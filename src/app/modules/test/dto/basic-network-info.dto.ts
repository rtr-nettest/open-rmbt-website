import { IBasicNetworkInfo } from "../interfaces/basic-network-info.interface"

export class BasicNetworkInfo implements IBasicNetworkInfo {
  constructor(
    public serverName: string = "-",
    public ipAddress: string = "-",
    public providerName: string = "-",
    public testUuid?: string,
    public openTestUuid?: string,
    public coordinates?: [number, number]
  ) {}
}
