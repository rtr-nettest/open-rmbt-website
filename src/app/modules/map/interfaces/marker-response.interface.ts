import { IRecentMeasurement } from "../../opendata/interfaces/recent-measurements-response.interface"
import { NetworkMeasurementType } from "../constants/network-measurement-type"

export interface IMarkerResponse {
  measurements: IMarkerResponseItem[]
}

export interface IMarkerResponseItem {
  lat: number
  lon: number
  measurement_result: Partial<IRecentMeasurement>
  network_info: {
    network_type_label: string
    provider_name: string
  }
  open_test_uuid: string
  time: number
  time_string: string
}
