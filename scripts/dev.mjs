import { spawn, execSync } from "node:child_process";
import qrcode from "qrcode-terminal";

const PORT = process.env.PORT || "3001";

// 1. Limpiar cualquier proceso anterior que esté ocupando el puerto
try {
  execSync(`fuser -k ${PORT}/tcp 2>/dev/null || true`);
} catch {}

console.log("\n\x1b[38;2;57;255;20m%s\x1b[0m", "==================================================================");
console.log("\x1b[1m\x1b[38;2;255;215;0m%s\x1b[0m", "   🏋️‍♂️  MAXEADOS · SERVIDOR LISTO PARA CELULAR Y PC  🔥");
console.log("\x1b[38;2;57;255;20m%s\x1b[0m", "==================================================================");
console.log("");
console.log(`  💻 \x1b[1mEn tu computadora:\x1b[0m     \x1b[36mhttp://localhost:${PORT}\x1b[0m`);
console.log("");
console.log("  🌐 \x1b[33mGenerando enlace seguro HTTPS para tu celular...\x1b[0m");

// 2. Iniciar túnel Cloudflare seguro
const tunnel = spawn("npx", ["--yes", "cloudflared", "tunnel", "--url", `http://localhost:${PORT}`], {
  shell: true,
});

let printed = false;
tunnel.stderr.on("data", (data) => {
  const text = data.toString();
  const match = text.match(/https:\/\/[a-zA-Z0-9-]+\.trycloudflare\.com/);
  if (match && !printed) {
    printed = true;
    const mobileUrl = match[0];
    console.log("\n\x1b[1m\x1b[32m%s\x1b[0m", "  📱 ¡LISTO PARA TU CELULAR! (Funciona con Wi-Fi o datos 4G/5G):");
    console.log(`  👉 \x1b[4m\x1b[36m${mobileUrl}\x1b[0m\n`);
    console.log("  📲 \x1b[33mESCANEA ESTE CÓDIGO QR CON LA CÁMARA DE TU CELULAR:\x1b[0m\n");
    qrcode.generate(mobileUrl, { small: true });
    console.log("\x1b[38;2;57;255;20m%s\x1b[0m", "\n==================================================================\n");
  }
});

// 3. Iniciar Next.js
const child = spawn("npx", ["next", "dev", "-H", "0.0.0.0", "-p", PORT], {
  stdio: "inherit",
  shell: true,
});

function cleanup() {
  try { tunnel.kill(); } catch {}
  try { child.kill(); } catch {}
  process.exit(0);
}

process.on("SIGINT", cleanup);
process.on("SIGTERM", cleanup);
child.on("exit", cleanup);
