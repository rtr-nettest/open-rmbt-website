import { Injectable, signal } from "@angular/core"
import { MapSourceOptions } from "../services/map.service"

@Injectable({
  providedIn: "root",
})
export class MapStoreService {
  filters = signal<MapSourceOptions | null>(null)
}
