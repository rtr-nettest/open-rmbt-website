import { HttpInterceptorFn, HttpRequest } from "@angular/common/http"
import { inject } from "@angular/core"
import { catchError, of, tap } from "rxjs"
import { MatSnackBar } from "@angular/material/snack-bar"
import { NO_ERROR_HANDLING } from "../constants/strings"
import { ConnectivityService } from "../../test/services/connectivity.service"

const showFriendlyMessage = (
  snackBar: MatSnackBar,
  req: HttpRequest<any>,
  err: any,
) => {
  let message = "Something went wrong"
  if (err.status === 0) {
    message = "Network error"
  }
  if (err.status >= 400) {
    switch (err.status) {
      case 400:
        message = "Bad request"
        break
      case 401:
        message = "Unauthorized"
        break
      case 403:
        message = "Forbidden"
        break
      case 404:
        message = "Not found"
        break
      case 405:
        message = "Method not allowed"
        break
      case 415:
        message = "Unsupported media type"
        break
    }
  }
  const path = req.url
    .split("/")
    .slice(3)
    .join("/")
    .replace(/\?[.]*$/g, "")
  snackBar.open(`${req.method} ${path}: ${message}`, "Dismiss", {
    duration: 5000,
  })
}

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const snackBar = inject(MatSnackBar)
  const connectivityService = inject(ConnectivityService)
  return next(req).pipe(
    tap(() => {
      if (!connectivityService.isOnline()) {
        connectivityService.isOnline.set(true)
      }
    }),
    catchError((err) => {
      if (err.status === 0) {
        connectivityService.isOnline.set(false)
      }
      if (!req.headers.has(NO_ERROR_HANDLING)) {
        showFriendlyMessage(snackBar, req, err)
      }
      return of(err)
    }),
  )
}
