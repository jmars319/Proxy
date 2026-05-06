import fs from "node:fs";
import path from "node:path";

const fixtureDir = path.resolve("fixtures/handoffs");
const expectedSurfaces = new Set(["moderation-note", "operator-brief", "email", "report"]);

function listJsonFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(dir, entry.name);
    return entry.isDirectory() ? listJsonFiles(fullPath) : entry.name.endsWith(".json") ? [fullPath] : [];
  });
}

const files = listJsonFiles(fixtureDir);
if (files.length === 0) throw new Error("No handoff fixtures found.");

for (const file of files) {
  const payload = JSON.parse(fs.readFileSync(file, "utf8"));
  if (!payload || typeof payload !== "object" || typeof payload.traceId !== "string") {
    throw new Error(`${file} must contain a shape request with a traceId.`);
  }
  if (!expectedSurfaces.has(payload.surface)) {
    throw new Error(`${file} uses an unsupported output surface: ${payload.surface}`);
  }
}

console.log(`Validated ${files.length} Proxy handoff fixture(s).`);
