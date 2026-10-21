// Prepara el entorno local: escribe .env.development.local con la URL y la anon key del Supabase local.
// En `npm run dev` ese archivo tiene prioridad sobre .env.local (que apunta al Supabase en la nube).
// Uso: npx supabase start && npm run setup:local
import { execSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";

let status;
try {
  status = execSync("npx supabase status -o env", { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] });
} catch {
  console.error("✖ Supabase local no está corriendo. Abre Docker y ejecuta: npx supabase start");
  process.exit(1);
}

const read = (key) => status.match(new RegExp(`^${key}="?([^"\\n]+)"?`, "m"))?.[1];
const url = read("API_URL");
const anon = read("ANON_KEY");
if (!url || !anon) {
  console.error("✖ No se encontró API_URL / ANON_KEY en `supabase status`.");
  process.exit(1);
}

const file = ".env.development.local";
if (existsSync(file) && !readFileSync(file, "utf8").includes("127.0.0.1")) {
  console.error(`✖ ${file} ya existe y no apunta a Supabase local. Renómbralo si quieres generar uno nuevo.`);
  process.exit(1);
}
writeFileSync(file, `NEXT_PUBLIC_SUPABASE_URL=${url}\nNEXT_PUBLIC_SUPABASE_ANON_KEY=${anon}\n`);
console.log(`✔ ${file} listo (${url}). Corre: npm run dev  →  http://localhost:3000`);
