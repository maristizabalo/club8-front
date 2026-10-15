import type { Metadata } from "next";

import { Armazon } from "@/components/panel/Armazon";
import { SesionProvider } from "@/lib/sesion";

export const metadata: Metadata = {
  title: { default: "Panel", template: "%s · Panel Club 8" },
  robots: { index: false, follow: false },
};

/* El panel de operación vive aparte del sitio: otro armazón, sin la cabecera pública. Todo lo de
   aquí adentro corre en el navegador, porque depende del token del personal. */
export default function LayoutPanel({ children }: LayoutProps<"/admin">) {
  return (
    <SesionProvider>
      <Armazon>{children}</Armazon>
    </SesionProvider>
  );
}
