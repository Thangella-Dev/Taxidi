import fs from "node:fs";
import path from "node:path";

const directory = path.resolve("supabase/migrations");
const files = fs.readdirSync(directory).filter((file) => file.endsWith(".sql")).sort();
const errors = [];
const prefixes = new Set();

for (const file of files) {
  if (!/^\d{14}_[a-z0-9_]+\.sql$/.test(file)) errors.push(`${file}: expected YYYYMMDDHHMMSS_snake_case.sql`);
  const prefix = file.slice(0, 14);
  if (prefixes.has(prefix)) errors.push(`${file}: duplicate migration timestamp ${prefix}`);
  prefixes.add(prefix);
  const raw = fs.readFileSync(path.join(directory, file));
  if (raw.length >= 3 && raw[0] === 0xef && raw[1] === 0xbb && raw[2] === 0xbf) {
    errors.push(`${file}: UTF-8 BOM is not allowed; Supabase Preview can fail before parsing SQL`);
  }
  const sql = raw.toString("utf8");
  if (/\bdrop\s+table\b/i.test(sql)) errors.push(`${file}: DROP TABLE requires an explicitly reviewed destructive migration`);
  if (/\btruncate\b/i.test(sql)) errors.push(`${file}: TRUNCATE is forbidden in migrations`);
  if (/\bdelete\s+from\s+auth\.(users|identities)\b/i.test(sql)) errors.push(`${file}: deleting auth records is forbidden`);
}

if (!files.length) errors.push("No Supabase migrations found");
if (errors.length) {
  console.error(errors.join("\n"));
  process.exit(1);
}
console.log(`Validated ${files.length} additive Supabase migrations.`);
