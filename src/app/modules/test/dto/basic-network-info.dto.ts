import { IBasicNetworkInfo } from "../interfaces/basic-network-info.interface"

export class BasicNetworkInfo implements IBasicNetworkInfo {
  serverName = "-"
  providerName = "-"
  ipAddress = "-"
  coordinates?: [number, number]
}
