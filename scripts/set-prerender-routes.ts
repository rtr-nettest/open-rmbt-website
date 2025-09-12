import { ERoutes } from "../src/app/modules/shared/constants/routes.enum"
import fs from "fs"
import path from "path"

function main() {
  const out: string[] = []
  const ws = fs.createWriteStream(
    path.resolve(__dirname, "..", "src", "prerender-routes.txt")
  )
  for (const route of Object.values(ERoutes)) {
    if (route.includes(":")) {
      continue
    }
    const path = "/" + route
    out.push(path)
    ws.write(path + "\n")
  }
  const localeFiles = fs.readdirSync(
    path.resolve(__dirname, "..", "src", "assets", "i18n")
  )
  for (const file of localeFiles) {
    if (!file.endsWith(".json")) {
      continue
    }
    const [locale, _] = file.split(".")
    for (const path of out) {
      ws.write("/" + locale + path + "\n")
    }
  }
  ws.close()
}

main()
