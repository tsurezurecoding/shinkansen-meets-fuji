import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const extensions = new Set([".js", ".cjs", ".mjs"]);
const excludedDirectories = new Set([".git", "node_modules", "vendor"]);
const files = [];

function walk(directory) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && excludedDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    if (entry.isDirectory()) walk(absolute);
    else if (extensions.has(path.extname(entry.name))) files.push(absolute);
  }
}

walk(appRoot);
files.sort();
for (const file of files) execFileSync(process.execPath, ["--check", file], { stdio: "inherit" });
console.log(`Syntax checked: ${files.length} first-party files.`);
