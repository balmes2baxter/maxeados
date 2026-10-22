import { spawn, execSync } from "node:child_process";
import os from "node:os";
import qrcode from "qrcode-terminal";

const PORT = process.env.PORT || "3001";
const USE_TUNNEL = process.argv.includes("--tunel") || process.argv.includes("--tunnel");

function getLocalIp() {
  // 1. En WSL2, consultar la IP del host Windows en la red Wi-Fi
  try {
    const isWsl = os.release().toLowerCase().includes("microsoft") || process.env.WSL_DISTRO_NAME;
    if (isWsl) {
      const psIp = execSync(
        'powershell.exe -NoProfile -Command "(Get-NetIPAddress -InterfaceAlias *Wi-Fi* -AddressFamily IPv4).IPAddress"',
        { encoding: "utf-8", stdio: ["ignore", "pipe", "ignore"] }
      ).trim().split(/\r?\n/)[0].trim();
      if (psIp && /^(\d{1,3}\.){3}\d{1,3}$/.test(psIp)) {
        return psIp;
      }
    }
  } catch {
    // Continuar con interfaces nativas si falla
  }

  // 2. Interfaces nativas de red (Mac, Linux o WSL puro)
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === "IPv4" && !iface.internal && !iface.address.startsWith("127.")) {
        return iface.address;
      }
    }
  }
  return "localhost";
}

const localIp = getLocalIp();
const localUrl = `http://localhost:${PORT}`;
const mobileUrl = `http://${localIp}:${PORT}`;

console.log("\n\x1b[38;2;57;255;20m%s\x1b[0m", "==================================================================");
console.log("\x1b[1m\x1b[38;2;255;215;0m%s\x1b[0m", "   🏋️‍♂️  MAXEADOS · SERVIDOR LISTO PARA CELULAR Y PC  🔥");
console.log("\x1b[38;2;57;255;20m%s\x1b[0m", "==================================================================");
console.log("");
console.log(`  💻 \x1b[1mEn tu computadora:\x1b[0m     \x1b[36m${localUrl}\x1b[0m`);
console.log(`  📱 \x1b[1mEn tu celular (Wi-Fi):\x1b[0m  \x1b[32m\x1b[1m${mobileUrl}\x1b[0m`);
console.log("");
console.log("  📲 \x1b[33m\x1b[1mESCANEA ESTE CÓDIGO QR CON LA CÁMARA DE TU CELULAR:\x1b[0m");
console.log("");

// Código QR compacto en la consola
qrcode.generate(mobileUrl, { small: true });

console.log("");
console.log("\x1b[90m%s\x1b[0m", "  💡 Nota: Tu celular y tu PC deben estar en la misma red Wi-Fi.");
if (!USE_TUNNEL) {
  console.log("\x1b[90m%s\x1b[0m", "  💡 Para probar desde fuera del Wi-Fi (con datos móviles 4G/5G):");
  console.log("\x1b[35m%s\x1b[0m", "     npm run dev:tunel");
}
console.log("\x1b[38;2;57;255;20m%s\x1b[0m", "==================================================================\n");

// Si se pidió túnel, abrir localtunnel en segundo plano
if (USE_TUNNEL) {
  console.log("\x1b[35m%s\x1b[0m", "🌐 Iniciando túnel HTTPS para acceso con datos móviles...");
  const lt = spawn("npx", ["-y", "localtunnel", "--port", PORT], { shell: true });
  lt.stdout.on("data", (d) => {
    const text = d.toString();
    const match = text.match(/https:\/\/[^\s]+/);
    if (match) {
      console.log("\n\x1b[1m\x1b[32m%s\x1b[0m", "🚀 ENLACE PÚBLICO HTTPS PARA EL CELULAR:");
      console.log(`  👉 \x1b[4m\x1b[36m${match[0]}\x1b[0m\n`);
      qrcode.generate(match[0], { small: true });
    }
  });
}

// Iniciar Next.js en 0.0.0.0
const child = spawn("npx", ["next", "dev", "-H", "0.0.0.0", "-p", PORT], {
  stdio: "inherit",
  shell: true,
});

child.on("exit", (code) => {
  process.exit(code ?? 0);
});
