import { Cabecera } from "@/components/sitio/Cabecera";
import { Pie } from "@/components/sitio/Pie";
import { cargarClub } from "@/lib/club";

/* El armazón del sitio público: barra arriba, contenido en medio, pie abajo. El club se lee de
   la caché de cinco minutos: es la misma lectura que hace la portada, así que Next la resuelve
   una sola vez por render. */
export default async function LayoutSitio({ children }: LayoutProps<"/">) {
  const { club } = await cargarClub();
  return (
    <div className="sitio">
      <Cabecera />
      <main id="contenido">{children}</main>
      <Pie club={club} />
    </div>
  );
}
