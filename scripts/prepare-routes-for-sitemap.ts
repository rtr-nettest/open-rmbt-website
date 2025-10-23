import fs from "fs"
import path from "path"

function main() {
  const routesFile = fs
    .readFileSync(path.join(__dirname, "..", "src", "app", "app.routes.ts"))
    .toString()
  const simpleRoutes: string[] = []
  const originalLines = routesFile.split("\n")
  for (let [index, line] of originalLines.entries()) {
    if (line.includes("import") && !line.includes("ERoutes")) {
      continue
    }
    const prevLine = originalLines[index - 1] || ""
    if (
      line.includes("canActivate") ||
      line.includes("canDeactivate") ||
      line.includes("unloadOnlyFor") ||
      line.includes("Guard") ||
      (line.includes("],") && !prevLine.includes("},")) ||
      line.includes("component") ||
      line.includes("resolve")
    ) {
      continue
    }
    if (line.includes(": Routes =")) {
      line = "export const routes = ["
    }
    simpleRoutes.push(line)
  }
  fs.writeFileSync(
    path.join(__dirname, "..", "src", "app", "app.routes.simplified.ts"),
    simpleRoutes.join("\n")
  )
}

main()
