import { Injectable } from "@angular/core"
import { BehaviorSubject } from "rxjs"

@Injectable({
  providedIn: "root",
})
export class MainStore {
  inProgress$ = new BehaviorSubject<boolean>(false)
  error$ = new BehaviorSubject<Error | null>(null)
  referrer$ = new BehaviorSubject<string | null>(null)
}
