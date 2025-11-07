import { HttpInterceptorFn, HttpRequest } from "@angular/common/http"
import { inject } from "@angular/core"
import { catchError, of } from "rxjs"
import { MatSnackBar } from "@angular/material/snack-bar"
import { NO_ERROR_HANDLING } from "../constants/strings"

const showFriendlyMessage = (
  snackBar: MatSnackBar,
  req: HttpRequest<any>,
  err: any
) => {
  let message = "Something went wrong"
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
  return next(req).pipe(
    catchError((err) => {
      if (!req.headers.has(NO_ERROR_HANDLING)) {
        showFriendlyMessage(snackBar, req, err)
      }
      return of(err)
    })
  )
}
