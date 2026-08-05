const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.join(__dirname, "..");

function readJson(fileName) {
  return JSON.parse(fs.readFileSync(path.join(rootDir, fileName), "utf8"));
}

const manifest = readJson("manifest.json");
const packageJson = readJson("package.json");
const packageLock = readJson("package-lock.json");
const version = packageJson.version;

assert.match(version, /^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/, "version must use X.Y.Z format");
assert.equal(manifest.version, version, "manifest.json version must match package.json");
assert.equal(packageLock.version, version, "package-lock.json version must match package.json");
assert.equal(packageLock.packages[""].version, version, "package-lock.json root package version must match package.json");

console.log(`version tests passed (${version})`);
