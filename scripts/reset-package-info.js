const fs = require("fs")
const pack = require("../package.json")

function main() {
  pack.gitInfo = {}
  fs.writeFileSync("package.json", JSON.stringify(pack, null, 2))
}

main()
