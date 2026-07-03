import fs from "node:fs";
import path from "node:path";

const root = path.resolve(".next/static/chunks");
if (!fs.existsSync(root)) throw new Error("Run npm run build before checking performance budgets.");
const files = walk(root).filter((file) => file.endsWith(".js"));
const sizes = files.map((file) => ({ file: path.relative(root, file), bytes: fs.statSync(file).size }));
const total = sizes.reduce((sum, item) => sum + item.bytes, 0);
const largest = sizes.reduce((current, item) => item.bytes > current.bytes ? item : current, { file: "", bytes: 0 });
const totalBudget = 3_500_000;
const chunkBudget = 450_000;
console.log(JSON.stringify({ chunks: sizes.length, totalBytes: total, largest }, null, 2));
if (total > totalBudget || largest.bytes > chunkBudget) {
  console.error(`Performance budget exceeded: total <= ${totalBudget}, largest chunk <= ${chunkBudget}.`);
  process.exit(1);
}

function walk(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const target = path.join(directory, entry.name);
    return entry.isDirectory() ? walk(target) : [target];
  });
}
