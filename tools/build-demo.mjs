// Builds the DEMO website from this project:  node tools/build-demo.mjs [output folder]
// - same pages and design as the real app
// - DEMO_SITE = true and no Google connection (SCRIPT_URL emptied) → everything stays in the visitor's browser
// - never copies the backend code or the private question file (js/demo-questions.js)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.resolve(process.argv[2] || path.join(root, "..", "vendor-tech-evaluation-2026-demo"));
const COPY = ["index.html", "register.html", "exam.html", "practical.html", "admin.html", "manifest.webmanifest", ".nojekyll", "css", "assets", "js"];
const NEVER = new Set(["js/demo-questions.js"]);

fs.mkdirSync(out, { recursive: true });
// remove old copies of the files we manage (keeps the output folder's .git)
for (const item of COPY) fs.rmSync(path.join(out, item), { recursive: true, force: true });

const copy = (rel) => {
  if (NEVER.has(rel.replace(/\\/g, "/"))) return;
  const src = path.join(root, rel), dst = path.join(out, rel);
  if (fs.statSync(src).isDirectory()) { fs.mkdirSync(dst, { recursive: true }); fs.readdirSync(src).forEach(f => copy(path.join(rel, f))); }
  else fs.copyFileSync(src, dst);
};
COPY.forEach(copy);

// switch the copy into DEMO mode
const cfgPath = path.join(out, "js", "config.js");
let cfg = fs.readFileSync(cfgPath, "utf8");
const before = cfg;
cfg = cfg.replace(/export const DEMO_SITE = false;/, "export const DEMO_SITE = true;")
         .replace(/export const SCRIPT_URL\s*=\s*"[^"]*";/,'export const SCRIPT_URL = ""; // demo website: not connected to Google');
if (cfg === before || !/DEMO_SITE = true/.test(cfg) || !/SCRIPT_URL = ""/.test(cfg)) throw new Error("Could not switch config.js to demo mode");
fs.writeFileSync(cfgPath, cfg);

// safety checks: nothing private may end up in the demo folder
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.name === ".git" ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = walk(out);
if (files.some(f => /demo-questions\.js$|Code\.gs$/.test(f))) throw new Error("Private file copied into the demo!");
if (files.some(f => /\.(js|html)$/.test(f) && /script\.google\.com\/macros/.test(fs.readFileSync(f, "utf8")))) throw new Error("Google backend address found in the demo!");

fs.writeFileSync(path.join(out, "README.md"),
`# 2026 Vendor's Technicians Evaluation: DEMO website

Practice copy of the evaluation app. **It is not connected to Google.** Everything a visitor does is saved only in
their own browser. The Theoretical exam's sign-in page can be viewed, but **starting the exam is turned off**
(the real questions are never published).

- Evaluator PIN for the demo: **2468**
- To try the afternoon session in the morning, add \`?session=PM\` to a page address (e.g. \`exam.html?session=PM\`).
- "Start over" in the yellow banner clears this browser's demo data.

This folder is generated from the main project with \`node tools/build-demo.mjs\`. Don't edit it by hand.
`);
console.log(`Demo website built in ${out} (${files.length} files).`);
