import { existsSync, readFileSync } from "node:fs";
import path from "node:path";

const rootDir = path.resolve(import.meta.dirname, "..");

const expectedPackages = new Map([
  ["apps/desktopapp/package.json", "@proxy/desktopapp"],
  ["apps/webapp/package.json", "@proxy/webapp"],
  ["apps/mobileapp/package.json", "@proxy/mobileapp"],
  ["packages/shared-types/package.json", "@proxy/shared-types"],
  ["packages/domain/package.json", "@proxy/domain"],
  ["packages/api-contracts/package.json", "@proxy/api-contracts"],
  ["packages/validation/package.json", "@proxy/validation"],
  ["packages/auth/package.json", "@proxy/auth"],
  ["packages/privacy/package.json", "@proxy/privacy"],
  ["packages/ui/package.json", "@proxy/ui"],
  ["packages/config/package.json", "@proxy/config"],
  ["packages/profiles/package.json", "@proxy/profiles"],
  ["packages/rewrite-engine/package.json", "@proxy/rewrite-engine"],
  ["packages/policy/package.json", "@proxy/policy"],
  ["packages/providers/package.json", "@proxy/providers"],
  ["packages/storage/package.json", "@proxy/storage"]
]);

const failures = [];
const seenNames = new Set();

for (const [relativePath, expectedName] of expectedPackages.entries()) {
  const absolutePath = path.join(rootDir, relativePath);

  if (!existsSync(absolutePath)) {
    failures.push(`Missing manifest: ${relativePath}`);
    continue;
  }

  const json = JSON.parse(readFileSync(absolutePath, "utf8"));

  if (json.name !== expectedName) {
    failures.push(`Expected ${relativePath} to be named ${expectedName}, found ${json.name ?? "<missing>"}`);
  }

  if (seenNames.has(json.name)) {
    failures.push(`Duplicate package name detected: ${json.name}`);
  }

  seenNames.add(json.name);
}

if (failures.length > 0) {
  console.error("Package check failed:");
  for (const failure of failures) {
    console.error(`- ${failure}`);
  }
  process.exit(1);
}

console.log(`Package check passed for ${expectedPackages.size} workspace manifests.`);
