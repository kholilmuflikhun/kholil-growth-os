import { readdir, readFile, stat } from "node:fs/promises";
import { resolve, relative, extname } from "node:path";
import ts from "typescript";

const root = process.cwd();
const excluded = new Set(["node_modules", ".next", ".turbo", "dist", "generated", "coverage"]);
const sourceFiles = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) { if (!excluded.has(entry.name)) await walk(resolve(dir, entry.name)); continue; }
    if ([".ts", ".tsx", ".mts", ".cts"].includes(extname(entry.name)) && !entry.name.endsWith(".d.ts")) sourceFiles.push(resolve(dir, entry.name));
  }
}
await walk(root);
let errors = 0;
for (const file of sourceFiles) {
  const source = await readFile(file, "utf8");
  const result = ts.transpileModule(source, { fileName: file, reportDiagnostics: true, compilerOptions: { target: ts.ScriptTarget.ES2022, module: ts.ModuleKind.ESNext, jsx: ts.JsxEmit.ReactJSX } });
  for (const diagnostic of result.diagnostics ?? []) {
    if (diagnostic.category !== ts.DiagnosticCategory.Error) continue;
    errors++;
    const message = ts.flattenDiagnosticMessageText(diagnostic.messageText, " ");
    console.error(`${relative(root, file)}: ${message}`);
  }
}
const packageFiles = [];
async function findPackages(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (!entry.isDirectory() || excluded.has(entry.name)) continue;
    const file = resolve(dir, entry.name, "package.json");
    try { await stat(file); packageFiles.push(file); } catch { /* not a package */ }
    await findPackages(resolve(dir, entry.name));
  }
}
await findPackages(root);
for (const file of [resolve(root, "package.json"), ...packageFiles]) {
  const pkg = JSON.parse(await readFile(file, "utf8"));
  for (const group of ["dependencies", "devDependencies", "optionalDependencies"]) {
    for (const [name, version] of Object.entries(pkg[group] ?? {})) {
      if (version === "latest" || /^(\*|latest|next|canary|beta|alpha|rc)$/.test(String(version))) {
        errors++;
        console.error(`${relative(root, file)}: ${name} uses floating version ${version}`);
      }
    }
  }
}
console.log(`Static syntax/version policy check: ${sourceFiles.length} TS/TSX files scanned; ${errors} error(s).`);
if (!await stat(resolve(root, "pnpm-lock.yaml")).catch(() => null)) console.warn("pnpm-lock.yaml is missing: dependency resolution is not yet reproducible. Generate it with the pinned pnpm version in a network-enabled environment and commit it.");
process.exitCode = errors ? 1 : 0;
