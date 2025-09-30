import fs from "fs"
import path from "path"
import { execSync } from "child_process"

async function main() {
  const packagesTree = JSON.parse(
    execSync("npm ls --json --all", { encoding: "utf-8" })
  )
  const packagesInfo = await getPackageInfo(packagesTree)
  fs.writeFileSync(
    path.resolve(__dirname, "../dependencies.json"),
    JSON.stringify(packagesInfo, null, 2)
  )
  console.log("Packages total:", packagesInfo.length)
}

async function getPackageInfo(pack: any, name?: string): Promise<any[]> {
  const url = pack.resolved?.split("-")[0]
  console.log("Processing package:", pack.name || name, ". Resolved URL:", url)
  const { dependencies } = pack
  let result
  try {
    const { name, author, license, repository, homepage } = await fetch(
      url
    ).then((res) => res.json())
    result = { name, author, license, repository, homepage }
    if (Object.values(result).every((v) => !v)) {
      result = null
    }
  } catch (e) {
    result = null
  }
  if (!dependencies) {
    return [result]
  }
  let packagesInfo = []
  for (const [name, pack] of Object.entries(dependencies)) {
    const info = await getPackageInfo(pack, name)
    packagesInfo.push(...info)
  }
  return [result, ...packagesInfo].filter(Boolean)
}

main()
