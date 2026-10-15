import type { Metadata, Viewport } from "next";
import { Archivo } from "next/font/google";

import "./globals.css";

/* Una sola familia para todo el sitio. Archivo trae eje de anchura: los titulares la ensanchan
   un poco y el texto corrido la usa normal. Se auto-hospeda con next/font, sin pedirle nada a un
   tercero cuando la página carga. */
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  display: "swap",
  variable: "--font-archivo",
});

const ORIGEN = process.env.NEXT_PUBLIC_SITIO_URL?.trim().replace(/\/$/, "");
// Con un valor sin esquema `new URL` lanza y se cae la compilación: se asume https.
const URL_SITIO = !ORIGEN ? "http://localhost:3000" : /^https?:\/\//.test(ORIGEN) ? ORIGEN : `https://${ORIGEN}`;

export const metadata: Metadata = {
  metadataBase: new URL(URL_SITIO),
  title: {
    default: "Billares Club 8 · Doce mesas de tres bandas en Chapinero",
    template: "%s · Billares Club 8",
  },
  description:
    "Club de billar a tres bandas en la Calle 63 # 15-32, Chapinero, Bogotá. Doce mesas Jimar de competición, café bar y terraza. Mira el plano y reserva tu mesa en línea.",
  applicationName: "Billares Club 8",
  openGraph: {
    type: "website",
    locale: "es_CO",
    siteName: "Billares Club 8",
    title: "Billares Club 8 · Reserva tu mesa de tres bandas",
    description: "Doce mesas Jimar en Chapinero, de lunes a sábado. Elige tu mesa en el plano y sepárala en un minuto.",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#0b0b0c",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-CO" className={archivo.variable}>
      <body>{children}</body>
    </html>
  );
}
