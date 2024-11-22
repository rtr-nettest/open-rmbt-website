import { Injectable, signal } from "@angular/core"

@Injectable({
  providedIn: "root",
})
export class ErrorStore {
  $originalPath = signal("")
}
