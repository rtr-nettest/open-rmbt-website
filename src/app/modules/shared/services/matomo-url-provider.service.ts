import { Injectable } from "@angular/core"
import { NavigationEnd } from "@angular/router"
import { PageUrlProvider } from "ngx-matomo-client"
import { Observable, of } from "rxjs"

@Injectable()
export class MatomoUrlProviderService implements PageUrlProvider {
  getCurrentPageUrl(event: NavigationEnd): Observable<string> {
    let urlParts = event.urlAfterRedirects.split("?")
    let resUrl = urlParts.length > 1 ? urlParts[0] : event.urlAfterRedirects
    urlParts = resUrl.split("#")
    if (urlParts.length > 1) {
      resUrl = urlParts[0]
    }
    return of(resUrl)
  }
}
