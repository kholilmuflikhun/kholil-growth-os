#!/usr/bin/env node
const targets = [
  { name: "Public website", url: process.env.WEB_HEALTH_URL || "http://localhost:3000/api/health" },
  { name: "GOS dashboard", url: process.env.GOS_HEALTH_URL || "http://localhost:3001/api/health" },
];
let failed = false;
for (const target of targets) {
  try {
    const response = await fetch(target.url, { signal: AbortSignal.timeout(8000) });
    const body = await response.text();
    if (!response.ok) {
      failed = true;
      console.error(`FAIL ${target.name}: HTTP ${response.status} (${target.url})`);
      continue;
    }
    let parsed;
    try { parsed = JSON.parse(body); } catch { parsed = null; }
    if (!parsed || (parsed.status && !["ok", "healthy"].includes(String(parsed.status).toLowerCase()))) {
      failed = true;
      console.error(`FAIL ${target.name}: unexpected health payload (${target.url})`);
      continue;
    }
    console.log(`PASS ${target.name}: HTTP ${response.status} (${target.url})`);
  } catch (error) {
    failed = true;
    console.error(`FAIL ${target.name}: ${error instanceof Error ? error.message : String(error)} (${target.url})`);
  }
}
if (failed) process.exit(1);
console.log("Smoke tests passed. This checks only health endpoints, not authenticated business workflows.");
