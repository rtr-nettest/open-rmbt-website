import { BasicNetworkInfo } from "../dto/basic-network-info.dto"
import { IBasicNetworkInfo } from "../interfaces/basic-network-info.interface"
import { ICoords } from "../interfaces/coords.interface"

export class RmbtwsDelegateService {
  private _positions: ICoords[] = []

  constructor(
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

  getLatestCoords() {
    const { geo_lat: lat, geo_long: lon } = this._positions.slice(-1)[0] || {}
    return lat && lon ? [lon, lat] : undefined
  }

  setLocation(coordinates: ICoords) {
    let previousItem: ICoords | null = null
    this._positions.push(coordinates)
    this._positions = this._positions.filter((position) => {
      if (!position?.precise) {
        return false
      }
      if (previousItem == null) {
        previousItem = position
        return true
      }
      const equal = JSON.stringify(previousItem) === JSON.stringify(position)
      if (equal) {
        //remove this item
        return false
      } else {
        previousItem = position
        return true
      }
    })
  }
}
