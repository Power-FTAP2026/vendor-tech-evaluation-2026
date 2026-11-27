// Builds the DEMO website from this project:  node tools/build-demo.mjs [output folder]
// - same pages and design as the real app
// - DEMO_SITE = true → registrations and practice scores stay in the visitor's browser (never sent to Google).
//   Only READ-ONLY calls reach Google: checking the demo PIN and loading that evaluator's station scenarios.
// - never copies the backend code or the private question file (js/demo-questions.js)
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const out = path.resolve(process.argv[2] || path.join(root, "..", "vendor-tech-evaluation-2026-demo"));
const COPY = ["index.html", "monitor.html", "register.html", "exam.html", "practical.html", "admin.html", "feedback.html", "manifest.webmanifest", ".nojekyll", "css", "assets", "js"];
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
         .replace(/export const FEEDBACK_URL\s*=\s*"[^"]*";/, 'export const FEEDBACK_URL = ""; // demo website: feedback is never saved');
if (cfg === before || !/DEMO_SITE = true/.test(cfg)) throw new Error("Could not switch config.js to demo mode");
if (!/export const FEEDBACK_URL = "";/.test(cfg)) throw new Error("Could not blank FEEDBACK_URL for the demo");
fs.writeFileSync(cfgPath, cfg);

// safety checks: nothing private may end up in the demo folder
const walk = (d) => fs.readdirSync(d, { withFileTypes: true }).flatMap(e => e.name === ".git" ? [] : e.isDirectory() ? walk(path.join(d, e.name)) : [path.join(d, e.name)]);
const files = walk(out);
if (files.some(f => /demo-questions\.js$|Code\.gs$/.test(f))) throw new Error("Private file copied into the demo!");
// the backend address may only appear in js/config.js (used READ-ONLY by js/demo-backend.js for the evaluator review)
if (files.some(f => /\.(js|html)$/.test(f) && !/[\\/]js[\\/]config\.js$/.test(f) && /script\.google\.com\/macros/.test(fs.readFileSync(f, "utf8")))) throw new Error("Google backend address found outside config.js!");
// the real practical scenarios must never be copied into the demo code
const gsPath = path.join(root, "apps-script", "Code.gs");
if (fs.existsSync(gsPath)) {
  const table = (fs.readFileSync(gsPath, "utf8").match(/const DEFAULT_PRACTICAL = \[[\s\S]*?\n\];/) || [""])[0];
  if (!table) throw new Error("Could not find DEFAULT_PRACTICAL in Code.gs for the scenario check");
  const real = [...table.matchAll(/\[\s*"[^"]+"\s*,\s*"[^"]*"\s*,\s*"([^"]{8,})"/g)].map(m => m[1]);
  const hit = files.filter(f => /\.(js|html|md)$/.test(f) && real.some(r => fs.readFileSync(f, "utf8").includes(r)));
  if (hit.length) throw new Error("Real scenario text found in the demo: " + hit.join(", "));
}

fs.writeFileSync(path.join(out, "README.md"),
`# 2026 Vendor's Technicians Evaluation: DEMO website

Practice copy of the evaluation app. **Nothing is saved to Google:** registrations and practice scores stay only in
the visitor's own browser. The Theoretical exam's sign-in page can be viewed, but **starting the exam is turned off**
(the real questions are never published).

- Practical: evaluators log in with the **demo PIN** (given to evaluators only) to review the real scenarios of their own station.
  The scenarios are loaded read-only from the evaluation backend after the PIN is checked; they are not in this code.
- To try the afternoon session in the morning, add \`?session=PM\` to a page address (e.g. \`exam.html?session=PM\`).
- "Start over" in the yellow banner clears this browser's demo data.

This folder is generated from the main project with \`node tools/build-demo.mjs\`. Don't edit it by hand.
`);
console.log(`Demo website built in ${out} (${files.length} files).`);
