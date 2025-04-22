import { BasicNetworkInfo } from "../dto/basic-network-info.dto"
import { IBasicNetworkInfo } from "../interfaces/basic-network-info.interface"
import { ICoords } from "../interfaces/coords.interface"

export class RmbtwsDelegateService {
  private _positions: ICoords[] = []

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

  setLocation(coordinates: ICoords) {
    const { geo_lat: lat, geo_long: lon } = coordinates
    this._positions.push(coordinates)
    if (!lat || !lon) {
      return
    }
    const info = this.getFunc()
    info.coordinates = [lon, lat]
    this.setFunc(info)
  }

  getGeoResults() {
    //filter duplicate results that can occur when using hardware GPS devices
    //with certain Browsers
    let previousItem: ICoords | null = null
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

    return this._positions
  }
}
