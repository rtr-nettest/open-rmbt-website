import { Injectable } from "@angular/core"
import { ICoords } from "../interfaces/coords.interface"

const _errorTimeout = 2e3 //2 seconds error timeout
const _maxAge = 60e3 //up to one minute old - don't do geoposition again

@Injectable({
  providedIn: "root",
})
export class GeoTrackerService {
  private _watcher: number | null = null

  constructor() {}

  async startGeoTracking(
    onError: (reason: string) => void,
    onData: (data: ICoords) => void
  ) {
    const onSuccess = (position: any, precise = false) => {
      const p = {
        geo_lat: position.coords.latitude,
        geo_long: position.coords.longitude,
        accuracy: position.coords.accuracy,
        altitude: position.coords.altitude,
        bearing: position.coords.heading,
        speed: position.coords.speed,
        tstamp: position.timestamp,
        provider: "Browser",
        precise,
      }
      onData(p)
    }

    if (navigator.geolocation) {
      //try to get an rough first position
      navigator.geolocation.getCurrentPosition(
        (success) => {
          onSuccess(success)
        },
        (error) => {
          onError(error.message)
        },
        {
          enableHighAccuracy: false,
          timeout: _errorTimeout, //2 seconds
          maximumAge: _maxAge, //one minute
        }
      )
      //and refine this position later
      this._watcher = navigator.geolocation.watchPosition(
        (success) => {
          onSuccess(success, true)
        },
        (error) => {
          onError(error.message)
        },
        {
          enableHighAccuracy: true,
          timeout: Infinity,
          maximumAge: 0,
        }
      )
    }
  }

  stopGeoTracking() {
    if (navigator.geolocation && this._watcher) {
      navigator.geolocation.clearWatch(this._watcher)
      this._watcher = null
    }
  }
}
