import type { Metadata, Viewport } from "next";
import { Suspense } from "react";
import "@fontsource/press-start-2p";
import "@fontsource/vt323";
import "./globals.css";
import { Toaster } from "@/components/Toaster";
import { PixelLoader } from "@/components/PixelLoader";

export const metadata: Metadata = {
  title: "Maxeados · Liga de fuerza relativa",
  description: "Competencia de fuerza relativa para gimnasios. Maxea las 6 máquinas y pelea el pozo mensual de $100.000 COP.",
};

export const viewport: Viewport = {
  themeColor: "#0d0a14",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es">
      <body>
        {/* Con cacheComponents, toda lectura de sesión debe vivir dentro de un Suspense. */}
        <Suspense fallback={<PixelLoader />}>{children}</Suspense>
        <Toaster />
      </body>
    </html>
  );
}
