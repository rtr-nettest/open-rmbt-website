const fs = require("fs")
const pack = require("../package.json")

const { execSync } = require("child_process")

function main() {
  // Semantic version derived from the git tag, including the commit hash so a
  // build can always be traced back to an exact commit (e.g. "2.10.1-3-gabc1234").
  const describe = (prefix = "") =>
    execSync(`${prefix}git describe --tags --long --always --dirty`)
      .toString()
      .trim()
      .replace(/^v/, "")

  pack.gitInfo = {
    hash: execSync("git rev-parse HEAD").toString().trim(),
    branch: execSync("git rev-parse --abbrev-ref HEAD").toString().trim(),
    version: describe(),
    rmbtwsHash: execSync("cd rmbtws && git rev-parse HEAD").toString().trim(),
    rmbtwsBranch: execSync("cd rmbtws && git rev-parse --abbrev-ref HEAD")
      .toString()
      .trim(),
    rmbtwsVersion: describe("cd rmbtws && "),
  }
  fs.writeFileSync("package.json", JSON.stringify(pack, null, 2))
}

main()
