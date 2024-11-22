import { inject } from "@angular/core"
import { Title } from "@angular/platform-browser"
import { ResolveFn } from "@angular/router"

export const titleResolver: (
  title: string,
  separator?: string
) => ResolveFn<string> =
  (title: string, separator = " - ") =>
  () => {
    const ts = inject(Title)
    const titleArr = ts.getTitle().split(separator)
    const siteName = titleArr.length === 1 ? titleArr[0] : titleArr[1]
    const newTitle = title ? [title, siteName].join(separator) : siteName
    ts.setTitle(newTitle)
    return title
  }
