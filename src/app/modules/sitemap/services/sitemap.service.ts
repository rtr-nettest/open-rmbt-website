import { Injectable } from "@angular/core"
import { FileService } from "../../shared/services/file.service"
import { from, map } from "rxjs"

@Injectable({
  providedIn: "root",
})
export class SitemapService {
  constructor(private readonly fileService: FileService) {}

  getSitemap(lang: string) {
    return from(this.fileService.getJsonAsset(`/sitemap.json`)).pipe(
      map((sitemap) => sitemap[lang] || sitemap["de"])
    )
  }
}
