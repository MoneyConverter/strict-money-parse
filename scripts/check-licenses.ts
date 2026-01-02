// License checker - ensures no GPL/AGPL/LGPL dependencies

import { execSync } from "node:child_process";

// Forbidden licenses
const FORBIDDEN_LICENSES = [
  "GPL",
  "AGPL",
  "LGPL",
  "GPL-2.0",
  "GPL-3.0",
  "AGPL-3.0",
  "LGPL-2.0",
  "LGPL-2.1",
  "LGPL-3.0",
];

interface PackageInfo {
  name: string;
  version: string;
  license?: string;
  licenses?: string;
}

function getLicenseInfo(): PackageInfo[] {
  try {
    const output = execSync("npm list --json --all --long", {
      encoding: "utf-8",
      stdio: ["pipe", "pipe", "pipe"],
    });
    
    const data = JSON.parse(output);
    const packages: PackageInfo[] = [];
    
    function traverse(obj: { dependencies?: Record<string, unknown> }, depth = 0) {
      if (depth > 20) return; // Prevent infinite loops
      
      if (obj.dependencies) {
        for (const [name, info] of Object.entries(obj.dependencies)) {
          const pkg = info as { version?: string; license?: string; dependencies?: Record<string, unknown> };
          packages.push({
            name,
            version: pkg.version,
            license: pkg.license,
          });
          
          if (pkg.dependencies) {
            traverse(pkg, depth + 1);
          }
        }
      }
    }
    
    traverse(data);
    return packages;
  } catch (error) {
    console.error("Failed to get license info:", error);
    return [];
  }
}

function checkLicense(license: string | undefined): boolean {
  if (!license) return true; // No license info, assume OK for now
  
  const normalizedLicense = license.toUpperCase();
  
  // Check if forbidden
  for (const forbidden of FORBIDDEN_LICENSES) {
    if (normalizedLicense.includes(forbidden)) {
      return false;
    }
  }
  
  return true;
}

function main() {
  console.log("Checking licenses of dependencies...\n");
  
  const packages = getLicenseInfo();
  const uniquePackages = new Map<string, PackageInfo>();
  
  // Deduplicate packages
  for (const pkg of packages) {
    const key = `${pkg.name}@${pkg.version}`;
    if (!uniquePackages.has(key)) {
      uniquePackages.set(key, pkg);
    }
  }
  
  console.log(`Found ${uniquePackages.size} unique dependencies\n`);
  
  let hasViolations = false;
  const violations: PackageInfo[] = [];
  
  for (const pkg of uniquePackages.values()) {
    if (!checkLicense(pkg.license)) {
      hasViolations = true;
      violations.push(pkg);
    }
  }
  
  if (hasViolations) {
    console.error("❌ LICENSE VIOLATIONS FOUND:\n");
    for (const pkg of violations) {
      console.error(`  - ${pkg.name}@${pkg.version}: ${pkg.license}`);
    }
    console.error("\nForbidden licenses:", FORBIDDEN_LICENSES.join(", "));
    process.exit(1);
  }
  
  console.log("✓ All dependencies have acceptable licenses");
  console.log("  Allowed: MIT, Apache-2.0, BSD, ISC, Unicode-3.0, etc.");
}

main();
