// Script to update ISO 4217 currency codes from official SIX source
// SIX is the maintenance agency for ISO 4217
// Source: https://www.six-group.com/en/products-services/financial-information/data-standards.html

import https from "node:https";
import fs from "node:fs";
import path from "node:path";

const URLS = [
  "https://www.six-group.com/dam/download/financial-information/data-center/iso-currrency/lists/list-one.xml",
];

function fetchText(url: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = https.get(
      url,
      {
        headers: {
          "user-agent": "strict-money-parse/1.0 (+https://npmjs.com/package/strict-money-parse)",
          accept: "application/xml,text/xml,*/*",
        },
      },
      (res) => {
        if (!res.statusCode || res.statusCode >= 400) {
          reject(new Error(`HTTP ${res.statusCode} for ${url}`));
          return;
        }
        let data = "";
        res.setEncoding("utf-8");
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve(data));
      }
    );
    req.on("error", reject);
  });
}

function extractCcyCodes(xml: string): string[] {
  const re = /<Ccy>([A-Z]{3})<\/Ccy>/g;
  const out: string[] = [];
  let m: RegExpExecArray | null;
  while ((m = re.exec(xml)) !== null) {
    out.push(m[1]);
  }
  return Array.from(new Set(out)).sort();
}

async function main() {
  let xml: string | null = null;
  let lastErr: unknown = null;

  for (const url of URLS) {
    try {
      console.log(`Trying ${url}...`);
      xml = await fetchText(url);
      console.log(`✓ Successfully fetched from ${url}`);
      break;
    } catch (e) {
      console.log(`✗ Failed: ${e instanceof Error ? e.message : String(e)}`);
      lastErr = e;
    }
  }

  if (!xml) {
    throw lastErr;
  }

  const codes = extractCcyCodes(xml);
  const outPath = path.resolve("src/data/iso4217.json");
  
  // Ensure directory exists
  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  
  fs.writeFileSync(outPath, JSON.stringify(codes, null, 2) + "\n", "utf-8");

  console.log(`\n✓ ISO 4217 updated: ${codes.length} codes -> ${outPath}`);
  console.log(`  First few codes: ${codes.slice(0, 5).join(", ")}...`);
}

main().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
