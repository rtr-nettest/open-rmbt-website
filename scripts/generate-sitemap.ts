import { routes } from "../src/app/app.routes.simplified"
import fs from "fs"
import path from "path"
import { ERoutes } from "../src/app/modules/shared/constants/routes.enum"
import locales from "../src/assets/available-locales.json"

const excludeFromSitemap = [
  ERoutes.HOME,
  ERoutes.TERMS,
  ERoutes.LOOP_2,
  ERoutes.LOOP_3,
  ERoutes.LOOP_RESULT,
  ERoutes.CERTIFIED_2,
  ERoutes.CERTIFIED_3,
  ERoutes.CERTIFIED_4,
  ERoutes.CERTIFIED_RESULT,
  ERoutes.OPEN_RESULT,
  ERoutes.RESULT,
  ERoutes.IFRAME,
  "**",
]

function getTree(locale: any, route: any): any {
  let output: any = null
  if (!excludeFromSitemap.includes(route.path) && route.path !== "") {
    const path = route.path == ":lang" ? "" : `/${route.path}`
    const title =
      route.path == ":lang" ? "Home" : route["data"]?.["title"] || null
    output = {
      path: `/${locale.code}${path}`,
      title,
    }
  }
  if (route.children) {
    for (const child of route.children) {
      output.children = [
        ...(output?.children || []),
        getTree(locale, child),
      ].filter((item) => item !== null)
    }
  }
  return output
}

function main() {
  const output = {} as Record<string, any>
  for (const locale of locales) {
    output[locale.code] = getTree(
      locale,
      routes.find((r) => r.path === ":lang")
    )
  }
  fs.writeFileSync(
    path.join(__dirname, "..", "src", "assets", "sitemap.json"),
    JSON.stringify(output, null, 2)
  )
}

main()
