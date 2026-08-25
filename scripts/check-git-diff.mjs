import { execFileSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
execFileSync("git", ["diff", "--check", "HEAD"], { cwd: appRoot, stdio: "inherit" });
console.log("Git diff whitespace check passed.");
