import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  partialPrefetching: true,
  // Para probar desde el celular en la misma red: DEV_LAN_HOST=192.168.x.x en .env.local
  allowedDevOrigins: [
    "*.trycloudflare.com",
    "*.loca.lt",
    "192.168.*",
    "10.*",
    "172.*",
    "localhost",
    "127.0.0.1",
    ...(process.env.DEV_LAN_HOST ? [process.env.DEV_LAN_HOST] : []),
  ],
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
