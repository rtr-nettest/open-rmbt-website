import { Injectable, signal } from "@angular/core"
import { firstValueFrom, interval, Subscription } from "rxjs"
import { formatTime } from "../../shared/adapters/app-date.adapter"
import { OpendataService } from "./opendata.service"
import { IRecentMeasurement } from "../interfaces/recent-measurements-response.interface"
import { IBasicResponse } from "../../tables/interfaces/basic-response.interface"

const UPDATE_INTERVAL = 5000

@Injectable({
  providedIn: "root",
})
export class LiveService {
  recentMeasurements = signal<IRecentMeasurement[]>([])
  tableData = signal<IBasicResponse<IRecentMeasurement> | null>(null)

  private intervalSub: Subscription | null = null
  private isInitialized = false
  private isReplaying = false

  constructor(private readonly measurements: OpendataService) {}

  watchMeasurements(watch = true) {
    if (this.intervalSub) {
      this.intervalSub.unsubscribe()
      this.intervalSub = null
    }
    if (!watch) {
      return
    }
    this.setMeasurements()
    this.intervalSub = interval(UPDATE_INTERVAL).subscribe(() => {
      if (this.isInitialized) {
        this.setMeasurements()
      } else {
        this.setReplayMeasurements()
      }
    })
  }

  private setMeasurements() {
    firstValueFrom(this.measurements.getRecentMeasurements()).then((resp) => {
      const content = (resp?.results ?? []).map((r) => formatTime(r))
      this.tableData.set({
        content: content.slice(0, 5),
        totalElements: 5,
      })
      this.recentMeasurements.set(
        content.filter((m) => m.lat && m.long).slice(0, 20),
      )
    })
  }

  private setReplayMeasurements() {
    if (this.isReplaying) {
      return
    }
    firstValueFrom(this.measurements.getRecentMeasurements()).then((resp) => {
      this.isReplaying = true
      const content = (resp?.results ?? []).map((r) => formatTime(r))
      const forMap = content.filter((m) => m.lat && m.long)
      this.recentMeasurements.set(forMap.slice(3, 23))
      this.tableData.set({
        content: forMap.slice(3, 8),
        totalElements: 5,
      })
      setTimeout(() => {
        this.recentMeasurements.set(forMap.slice(2, 22))
        this.tableData.set({
          content: forMap.slice(2, 7),
          totalElements: 5,
        })
      }, 4000)
      setTimeout(() => {
        this.recentMeasurements.set(forMap.slice(1, 21))
        this.tableData.set({
          content: forMap.slice(1, 6),
          totalElements: 5,
        })
      }, 7000)
      setTimeout(() => {
        this.recentMeasurements.set(forMap.slice(0, 20))
        this.tableData.set({
          content: forMap.slice(0, 5),
          totalElements: 5,
        })
        this.isInitialized = true
        this.isReplaying = false
      }, 10000)
    })
  }
}
