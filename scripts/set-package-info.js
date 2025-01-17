const fs = require("fs")
const pack = require("../package.json")
const { execSync } = require("child_process")

function main() {
  pack.gitInfo = {
    hash: execSync("git rev-parse HEAD").toString().trim(),
    branch: execSync("git rev-parse --abbrev-ref HEAD").toString().trim(),
  }
  fs.writeFileSync("package.json", JSON.stringify(pack, null, 2))
}

main()
