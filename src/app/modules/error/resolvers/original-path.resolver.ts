import { ResolveFn } from "@angular/router"
import { ErrorStore } from "../store/error-store.service"
import { inject } from "@angular/core"

export const originalPathResolver: ResolveFn<void> = () => {
  inject(ErrorStore).$originalPath.set(globalThis.location?.pathname)
}
