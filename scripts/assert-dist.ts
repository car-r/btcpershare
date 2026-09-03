import { readdirSync, readFileSync, statSync } from "fs";
import { join } from "path";

const DIST = "dist";
const BANNED = ["220,184", "8,712", "1,398", "5,102"];
const HERO = "187,751";

function walk(dir: string, acc: string[] = []): string[] {
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) walk(p, acc);
    else if (p.endsWith(".html")) acc.push(p);
  }
  return acc;
}

const htmlFiles = walk(DIST);
if (!htmlFiles.length) {
  console.error("no HTML in dist");
  process.exit(1);
}

let bannedHits = 0;
for (const file of htmlFiles) {
  const text = readFileSync(file, "utf8");
  for (const ban of BANNED) {
    if (text.includes(ban)) {
      console.error("banned number", ban, "in", file);
      bannedHits++;
    }
  }
}

const index = readFileSync(join(DIST, "index.html"), "utf8");
if (!index.includes(HERO)) {
  console.error("hero sats", HERO, "missing from dist/index.html");
  process.exit(1);
}
if (bannedHits) process.exit(1);

console.log("assert-dist: hero", HERO, "present; banned numbers absent across", htmlFiles.length, "html files");
