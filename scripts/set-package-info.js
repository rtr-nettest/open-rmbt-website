const fs = require("fs")
const path = require("path")
const { execSync } = require("child_process")

// Build-time git info is written to this GIT-IGNORED file (not package.json),
// so a build never modifies a tracked file - otherwise `git describe --dirty`
// would see the change and falsely report the version as "-dirty".
// Read by src/app/modules/shared/store/main.store.ts.
const OUTPUT = path.resolve(__dirname, "../src/git-info.json")

function run(cmd, fallback = "") {
  try {
    return execSync(cmd).toString().trim()
  } catch {
    return fallback
  }
}

// Semantic version from the git tag incl. the commit hash, e.g. "2.11.0-0-gba53ab3a".
const describe = (prefix = "") =>
  run(`${prefix}git describe --tags --long --always --dirty`).replace(/^v/, "")

function main() {
  const gitInfo = {
    hash: run("git rev-parse HEAD"),
    branch: run("git rev-parse --abbrev-ref HEAD"),
    version: describe(),
    rmbtwsHash: run("cd rmbtws && git rev-parse HEAD"),
    rmbtwsBranch: run("cd rmbtws && git rev-parse --abbrev-ref HEAD"),
    rmbtwsVersion: describe("cd rmbtws && "),
  }
  fs.writeFileSync(OUTPUT, JSON.stringify(gitInfo, null, 2) + "\n")
}

main()
